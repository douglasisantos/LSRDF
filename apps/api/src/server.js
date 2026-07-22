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

initializeDatabase();

const app = Fastify({
  logger: true
});

await app.register(cors, {
  origin: true
});

app.get('/health', async () => ({
  status: 'ok',
  service: 'lsrdf-api'
}));

app.get('/api/overview', async () => getOverview());
app.get('/api/championships', async () => getChampionships());
app.get('/api/teams', async () => getTeams());
app.get('/api/athletes', async () => getAthletes());
app.get('/api/matches', async () => getMatches());
app.get('/api/registrations', async () => getRegistrations());
app.get('/api/sponsors', async () => getSponsors());
app.get('/api/news', async () => getNews());
app.get('/api/categories', async () => getCategories());
app.get('/api/referees', async () => getReferees());
app.get('/api/venues', async () => getVenues());
app.get('/api/documents', async () => getDocuments());
app.get('/api/suspensions', async () => getSuspensions());
app.get('/api/broadcasts', async () => getBroadcasts());
app.get('/api/round-selections', async () => getRoundSelections());
app.get('/api/team-panels', async () => getTeamPanels());
app.get('/api/team-staff', async () => getTeamStaff());
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
    category: z.string().min(2)
  });

  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      message: 'Dados de inscricao invalidos',
      issues: parsed.error.flatten().fieldErrors
    });
  }

  return reply.code(201).send(createRegistration(parsed.data));
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
