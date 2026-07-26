import cors from '@fastify/cors';
import Fastify from 'fastify';
import { z } from 'zod';
import { initializeDatabase } from './db.js';
import {
  createAthlete,
  createBroadcast,
  createCategory,
  createChampionship,
  createDocument,
  createMatch,
  createNews,
  createReferee,
  createRegistration,
  createRoundSelection,
  createSponsor,
  createSuspension,
  createTeam,
  createTeamStaff,
  createVenue,
  generateRound,
  getAthletes,
  getBroadcasts,
  getCategories,
  getChampionships,
  getDocuments,
  getMatches,
  getNews,
  getOverview,
  getReferees,
  getRegistrations,
  getRoundSelections,
  getSponsors,
  getSuspensions,
  getMatchSheet,
  getTeamPanels,
  getTeamStaff,
  getTeams,
  getVenues,
  updateMatchSheet,
  updateMatchScore,
  updateRegistrationStatus
} from './repositories.js';
import { generateMatchSheetPdf } from './sheetPdf.js';
import {
  audit,
  authenticateRequest,
  createSession,
  ensureBootstrapAdmin,
  findUserByEmail,
  listUsers,
  publicUser,
  registerLocalUser,
  revokeSession,
  updateUserAccess,
  upsertGoogleUser,
  verifyGoogleCredential,
  verifyPassword
} from './auth.js';

initializeDatabase();
ensureBootstrapAdmin();

const app = Fastify({
  logger: true
});

await app.register(cors, {
  origin: (origin, callback) => {
    const allowed = (process.env.WEB_ORIGINS || 'http://localhost:9000')
      .split(',').map((item) => item.trim());
    callback(null, !origin || allowed.includes(origin));
  },
  allowedHeaders: ['Content-Type', 'Authorization']
});

app.addHook('onSend', async (_request, reply, payload) => {
  reply
    .header('X-Content-Type-Options', 'nosniff')
    .header('X-Frame-Options', 'DENY')
    .header('Referrer-Policy', 'strict-origin-when-cross-origin')
    .header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    .header('Cache-Control', 'no-store');
  return payload;
});

const publicReads = new Set([
  '/health', '/api/overview', '/api/championships', '/api/teams', '/api/athletes',
  '/api/matches', '/api/sponsors', '/api/news', '/api/categories', '/api/venues',
  '/api/broadcasts', '/api/round-selections'
]);
const staffOnlyPrefixes = [
  '/api/championships', '/api/categories', '/api/matches', '/api/referees',
  '/api/venues', '/api/suspensions', '/api/broadcasts', '/api/round-selections',
  '/api/sponsors', '/api/news', '/api/team-panels'
];

app.addHook('preHandler', async (request, reply) => {
  const path = request.url.split('?')[0];
  const isAuthRoute = path.startsWith('/api/auth/');
  const isPublicRegistration = request.method === 'POST' && path === '/api/registrations';
  const isPublicRead = request.method === 'GET' && publicReads.has(path);
  if (isAuthRoute || isPublicRegistration || isPublicRead || path === '/health') return;

  request.user = authenticateRequest(request);
  if (!request.user) return reply.code(401).send({ message: 'Autenticacao necessaria' });

  if (path.startsWith('/api/admin/') && request.user.role !== 'admin') {
    return reply.code(403).send({ message: 'Acesso exclusivo de administradores' });
  }
  if ((staffOnlyPrefixes.some((prefix) => path.startsWith(prefix)) ||
      (path === '/api/teams' && request.method !== 'GET') ||
      (path.startsWith('/api/registrations/') && request.method === 'PATCH')) &&
      !['staff', 'admin'].includes(request.user.role)) {
    return reply.code(403).send({ message: 'Acesso exclusivo da equipe LSRDF' });
  }
  if (request.user.role === 'user') {
    return reply.code(403).send({ message: 'Seu perfil nao possui acesso a esta area' });
  }
});

const loginAttempts = new Map();
function canAttempt(key) {
  const now = Date.now();
  const recent = (loginAttempts.get(key) || []).filter((time) => now - time < 15 * 60 * 1000);
  loginAttempts.set(key, recent);
  return recent.length < 10;
}
function recordAttempt(key) {
  loginAttempts.set(key, [...(loginAttempts.get(key) || []), Date.now()]);
}

app.get('/health', async () => ({
  status: 'ok',
  service: 'lsrdf-api'
}));

app.post('/api/auth/register', async (request, reply) => {
  const data = parseBody(z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(10).max(128),
    privacyAccepted: z.literal(true)
  }), request, reply);
  if (!data) return reply;
  if (findUserByEmail(data.email)) return reply.code(409).send({ message: 'Este e-mail ja possui cadastro' });
  const user = registerLocalUser(data);
  audit(request, 'register', 'user', user.id);
  return reply.code(201).send(createSession(user, request));
});

app.post('/api/auth/login', async (request, reply) => {
  const key = `${request.ip}:${request.body?.email || ''}`;
  if (!canAttempt(key)) return reply.code(429).send({ message: 'Muitas tentativas. Aguarde 15 minutos.' });
  const data = parseBody(z.object({
    email: z.string().trim().email(),
    password: z.string().min(1).max(128)
  }), request, reply);
  if (!data) return reply;
  const user = findUserByEmail(data.email);
  if (!user || !verifyPassword(data.password, user.password_hash) || user.status !== 'active') {
    recordAttempt(key);
    return reply.code(401).send({ message: 'E-mail ou senha invalidos' });
  }
  loginAttempts.delete(key);
  request.user = user;
  audit(request, 'login', 'session');
  return createSession(user, request);
});

app.post('/api/auth/google', async (request, reply) => {
  const data = parseBody(z.object({
    credential: z.string().min(20),
    privacyAccepted: z.boolean().default(false)
  }), request, reply);
  if (!data) return reply;
  try {
    const profile = await verifyGoogleCredential(data.credential);
    const user = upsertGoogleUser(profile, data.privacyAccepted);
    request.user = user;
    audit(request, 'google_login', 'session');
    return createSession(user, request);
  } catch (error) {
    return reply.code(401).send({ message: error.message });
  }
});

app.get('/api/auth/me', async (request, reply) => {
  request.user = authenticateRequest(request);
  if (!request.user) return reply.code(401).send({ message: 'Sessao invalida' });
  return publicUser(request.user);
});

app.post('/api/auth/logout', async (request, reply) => {
  request.user = authenticateRequest(request);
  revokeSession(request);
  return reply.code(204).send();
});

app.get('/api/admin/users', async () => listUsers());
app.patch('/api/admin/users/:id', async (request, reply) => {
  if (request.user.role !== 'admin') return reply.code(403).send({ message: 'Apenas administradores' });
  const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
  const data = parseBody(z.object({
    role: z.enum(['user', 'representative', 'staff', 'admin']),
    teamName: z.string().max(120).nullable().optional(),
    status: z.enum(['active', 'blocked'])
  }), request, reply);
  if (!data) return reply;
  const updated = updateUserAccess(params.id, data.role, data.teamName, data.status);
  audit(request, 'update_access', 'user', params.id);
  return updated;
});

app.get('/api/overview', async () => getOverview());
app.get('/api/championships', async () => getChampionships());
app.get('/api/teams', async (request) => {
  const user = authenticateRequest(request);
  return getTeams().map((item) => user ? item : ({ ...item, coach: undefined }));
});
app.get('/api/athletes', async (request) => {
  const user = authenticateRequest(request);
  return getAthletes()
    .filter((item) => user?.role !== 'representative' || item.team === user.team_name)
    .map((item) => ['staff', 'admin', 'representative'].includes(user?.role)
      ? item
      : ({ ...item, document: undefined }));
});
app.get('/api/matches', async () => getMatches());
app.get('/api/registrations', async (request) => {
  const items = getRegistrations();
  return request.user.role === 'representative'
    ? items.filter((item) => item.teamName === request.user.team_name)
    : items;
});
app.get('/api/sponsors', async () => getSponsors());
app.get('/api/news', async () => getNews());
app.get('/api/categories', async () => getCategories());
app.get('/api/referees', async () => getReferees());
app.get('/api/venues', async () => getVenues());
app.get('/api/documents', async (request) => {
  const items = getDocuments();
  return request.user.role === 'representative'
    ? items.filter((item) => item.ownerName === request.user.team_name)
    : items;
});
app.get('/api/suspensions', async () => getSuspensions());
app.get('/api/broadcasts', async () => getBroadcasts());
app.get('/api/round-selections', async () => getRoundSelections());
app.get('/api/team-panels', async () => getTeamPanels());
app.get('/api/team-staff', async (request) => {
  const items = getTeamStaff();
  return request.user.role === 'representative'
    ? items.filter((item) => item.team === request.user.team_name)
    : items;
});
app.get('/api/matches/:id/sheet', async (request) => {
  const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
  return getMatchSheet(params.id);
});

app.get('/api/matches/:id/sheet.pdf', async (request, reply) => {
  const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
  const sheet = getMatchSheet(params.id);
  const pdf = generateMatchSheetPdf(sheet);
  const filename = `sumula-${params.id}.pdf`;
  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `inline; filename="${filename}"`)
    .send(pdf);
});

function parseBody(schema, request, reply) {
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400).send({
      message: 'Dados invalidos',
      issues: parsed.error.flatten().fieldErrors
    });
    return null;
  }
  return parsed.data;
}

app.post('/api/championships', async (request, reply) => {
  const data = parseBody(z.object({
    name: z.string().min(2),
    category: z.string().min(2),
    status: z.string().min(2),
    teamsLimit: z.coerce.number().int().positive()
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createChampionship(data));
});

app.post('/api/categories', async (request, reply) => {
  const data = parseBody(z.object({
    name: z.string().min(2),
    gender: z.string().min(2),
    ageLimit: z.string().min(2)
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createCategory(data));
});

app.post('/api/teams', async (request, reply) => {
  const data = parseBody(z.object({
    name: z.string().min(2),
    city: z.string().min(2),
    coach: z.string().min(2),
    athletes: z.coerce.number().int().min(0).default(0)
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createTeam(data));
});

app.post('/api/athletes', async (request, reply) => {
  const data = parseBody(z.object({
    name: z.string().min(2),
    team: z.string().min(2),
    document: z.string().optional().default(''),
    jerseyNumber: z.string().optional().default(''),
    position: z.string().optional().default('Linha'),
    registrationStatus: z.string().optional().default('Apto')
  }), request, reply);
  if (!data) return reply;
  if (request.user.role === 'representative' && data.team !== request.user.team_name) {
    return reply.code(403).send({ message: 'Voce so pode cadastrar atletas da sua equipe' });
  }
  if (request.user.role === 'representative') data.registrationStatus = 'Pendente';
  return reply.code(201).send(createAthlete(data));
});

app.post('/api/matches', async (request, reply) => {
  const data = parseBody(z.object({
    championship: z.string().min(2).default('Copa Sul Riograndense 2026'),
    round: z.string().min(2),
    homeTeam: z.string().min(2),
    awayTeam: z.string().min(2),
    venue: z.string().min(2),
    date: z.string().min(8),
    time: z.string().min(4).default('20:00'),
    status: z.string().min(2).default('Agendado')
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createMatch(data));
});

app.patch('/api/matches/:id/sheet', async (request, reply) => {
  const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
  const data = parseBody(z.object({
    report: z.string().optional().default(''),
    firstHalfStart: z.string().optional().default(''),
    firstHalfEnd: z.string().optional().default(''),
    secondHalfStart: z.string().optional().default(''),
    secondHalfEnd: z.string().optional().default(''),
    extraPeriod: z.string().optional().default(''),
    status: z.string().optional().default('Pre-jogo')
  }), request, reply);
  if (!data) return reply;
  return updateMatchSheet(params.id, data);
});

app.post('/api/matches/generate-round', async (request, reply) => {
  const data = parseBody(z.object({
    round: z.string().min(2),
    date: z.string().min(8),
    venue: z.string().min(2)
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(generateRound(data));
});

app.patch('/api/matches/:id/score', async (request, reply) => {
  const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
  const data = parseBody(z.object({
    homeGoals: z.coerce.number().int().min(0),
    awayGoals: z.coerce.number().int().min(0),
    homeScorer: z.string().optional().default(''),
    awayScorer: z.string().optional().default('')
  }), request, reply);
  if (!data) return reply;
  return updateMatchScore(params.id, data);
});

app.post('/api/registrations', async (request, reply) => {
  const schema = z.object({
    teamName: z.string().min(2),
    responsible: z.string().min(2),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(8).max(30),
    category: z.string().min(2),
    privacyAccepted: z.literal(true)
  });

  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      message: 'Dados de inscricao invalidos',
      issues: parsed.error.flatten().fieldErrors
    });
  }

  const created = createRegistration(parsed.data);
  audit(request, 'create', 'registration', created.id);
  return reply.code(201).send(created);
});

app.patch('/api/registrations/:id/status', async (request, reply) => {
  const params = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
  const data = parseBody(z.object({ status: z.string().min(2) }), request, reply);
  if (!data) return reply;
  return updateRegistrationStatus(params.id, data.status);
});

app.post('/api/referees', async (request, reply) => {
  const data = parseBody(z.object({
    name: z.string().min(2),
    city: z.string().min(2),
    phone: z.string().min(6)
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createReferee(data));
});

app.post('/api/team-staff', async (request, reply) => {
  const data = parseBody(z.object({
    team: z.string().min(2),
    name: z.string().min(2),
    role: z.string().min(2),
    document: z.string().optional().default('')
  }), request, reply);
  if (!data) return reply;
  if (request.user.role === 'representative' && data.team !== request.user.team_name) {
    return reply.code(403).send({ message: 'Voce so pode cadastrar membros da sua equipe' });
  }
  return reply.code(201).send(createTeamStaff(data));
});

app.post('/api/venues', async (request, reply) => {
  const data = parseBody(z.object({
    name: z.string().min(2),
    city: z.string().min(2),
    address: z.string().min(2),
    capacity: z.coerce.number().int().min(0)
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createVenue(data));
});

app.post('/api/documents', async (request, reply) => {
  const data = parseBody(z.object({
    ownerType: z.string().min(2),
    ownerName: z.string().min(2),
    documentType: z.string().min(2),
    status: z.string().min(2),
    fileUrl: z.string().optional().default('')
  }), request, reply);
  if (!data) return reply;
  if (request.user.role === 'representative' && data.ownerName !== request.user.team_name) {
    return reply.code(403).send({ message: 'Voce so pode enviar documentos da sua equipe' });
  }
  if (request.user.role === 'representative') data.status = 'Recebido';
  return reply.code(201).send(createDocument(data));
});

app.post('/api/suspensions', async (request, reply) => {
  const data = parseBody(z.object({
    athlete: z.string().min(2),
    team: z.string().min(2),
    reason: z.string().min(2),
    matchesLeft: z.coerce.number().int().min(1)
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createSuspension(data));
});

app.post('/api/broadcasts', async (request, reply) => {
  const data = parseBody(z.object({
    matchId: z.coerce.number().int().positive(),
    platform: z.string().min(2),
    url: z.string().min(5)
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createBroadcast(data));
});

app.post('/api/round-selections', async (request, reply) => {
  const data = parseBody(z.object({
    round: z.string().min(2),
    athlete: z.string().min(2),
    team: z.string().min(2),
    note: z.string().min(2)
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createRoundSelection(data));
});

app.post('/api/sponsors', async (request, reply) => {
  const data = parseBody(z.object({
    name: z.string().min(2),
    tier: z.string().min(2)
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createSponsor(data));
});

app.post('/api/news', async (request, reply) => {
  const data = parseBody(z.object({
    title: z.string().min(2),
    tag: z.string().min(2)
  }), request, reply);
  if (!data) return reply;
  return reply.code(201).send(createNews(data));
});

const port = Number(process.env.PORT || 3333);
const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
