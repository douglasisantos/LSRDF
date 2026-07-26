import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db.js';

const SESSION_DAYS = Number(process.env.SESSION_DAYS || 7);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored?.startsWith('scrypt:')) return false;
  const [, salt, expectedHex] = stored.split(':');
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    teamName: user.team_name || null,
    status: user.status
  };
}

export function createSession(user, request) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  db.prepare(`
    INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, hashToken(token), expiresAt, request.headers['user-agent'] || '', request.ip);
  return { token, expiresAt, user: publicUser(user) };
}

export function authenticateRequest(request) {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  const result = db.prepare(`
    SELECT u.*, s.id AS session_id
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND datetime(s.expires_at) > CURRENT_TIMESTAMP AND u.status = 'active'
  `).get(hashToken(token));
  if (!result) return null;
  db.prepare('UPDATE sessions SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(result.session_id);
  return result;
}

export function revokeSession(request) {
  const token = (request.headers.authorization || '').replace(/^Bearer /, '');
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function audit(request, action, resource, resourceId = null) {
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(request.user?.id || null, action, resource, resourceId, request.ip);
}

export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
}

export function listUsers() {
  return db.prepare(`
    SELECT id, email, name, role, team_name AS teamName, status, created_at AS createdAt
    FROM users ORDER BY name
  `).all();
}

export function updateUserAccess(id, role, teamName, status) {
  db.prepare(`
    UPDATE users SET role = ?, team_name = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(role, teamName || null, status, id);
  return db.prepare(`
    SELECT id, email, name, role, team_name AS teamName, status, created_at AS createdAt
    FROM users WHERE id = ?
  `).get(id);
}

export function registerLocalUser(input) {
  const result = db.prepare(`
    INSERT INTO users (email, name, password_hash, role, privacy_accepted_at)
    VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP)
  `).run(input.email.toLowerCase(), input.name, hashPassword(input.password));
  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
}

export async function verifyGoogleCredential(credential) {
  if (!GOOGLE_CLIENT_ID) throw new Error('Login Google ainda nao foi configurado');
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) throw new Error('Credencial Google invalida');
  const profile = await response.json();
  if (profile.aud !== GOOGLE_CLIENT_ID || profile.email_verified !== 'true') {
    throw new Error('Conta Google nao autorizada');
  }
  return profile;
}

export function upsertGoogleUser(profile, privacyAccepted) {
  let user = findUserByEmail(profile.email);
  if (!user) {
    if (!privacyAccepted) throw new Error('Aceite da Politica de Privacidade obrigatorio');
    const result = db.prepare(`
      INSERT INTO users (email, name, google_subject, role, privacy_accepted_at)
      VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP)
    `).run(profile.email.toLowerCase(), profile.name || profile.email, profile.sub);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  } else if (!user.google_subject) {
    db.prepare('UPDATE users SET google_subject = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(profile.sub, user.id);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  }
  return user;
}

export function ensureBootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password || findUserByEmail(email)) return;
  db.prepare(`
    INSERT INTO users (email, name, password_hash, role, privacy_accepted_at)
    VALUES (?, 'Administrador LSRDF', ?, 'admin', CURRENT_TIMESTAMP)
  `).run(email, hashPassword(password));
}
