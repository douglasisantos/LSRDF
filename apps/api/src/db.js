import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new Database(join(dataDir, 'lsrdf.sqlite'));
db.pragma('journal_mode = WAL');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS championships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      teams_limit INTEGER NOT NULL,
      teams_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      coach TEXT NOT NULL,
      athletes INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS athletes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      goals INTEGER NOT NULL DEFAULT 0,
      yellow_cards INTEGER NOT NULL DEFAULT 0,
      red_cards INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      score TEXT NOT NULL DEFAULT '-',
      venue TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_name TEXT NOT NULL,
      responsible TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sponsors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tier TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      tag TEXT NOT NULL,
      published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      age_limit TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS referees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_type TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      status TEXT NOT NULL,
      file_url TEXT
    );

    CREATE TABLE IF NOT EXISTS suspensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      athlete TEXT NOT NULL,
      team TEXT NOT NULL,
      reason TEXT NOT NULL,
      matches_left INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS broadcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS round_selections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round TEXT NOT NULL,
      athlete TEXT NOT NULL,
      team TEXT NOT NULL,
      note TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_panels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_name TEXT NOT NULL,
      login TEXT NOT NULL,
      temporary_password TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      document TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Ativo'
    );

    CREATE TABLE IF NOT EXISTS match_sheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL UNIQUE,
      report TEXT NOT NULL DEFAULT '',
      first_half_start TEXT NOT NULL DEFAULT '',
      first_half_end TEXT NOT NULL DEFAULT '',
      second_half_start TEXT NOT NULL DEFAULT '',
      second_half_end TEXT NOT NULL DEFAULT '',
      extra_period TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pre-jogo'
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT,
      google_subject TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'representative', 'staff', 'admin')),
      team_name TEXT,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'blocked')),
      privacy_accepted_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT,
      ip_address TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      resource_id TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);
  `);

  migrateColumns();
  seedIfEmpty();
  seedFeatureTablesIfEmpty();
}

function addColumnIfMissing(table, column, definition) {
  const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((item) => item.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function migrateColumns() {
  addColumnIfMissing('athletes', 'document', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing('athletes', 'jersey_number', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing('athletes', 'position', "TEXT NOT NULL DEFAULT 'Linha'");
  addColumnIfMissing('athletes', 'registration_status', "TEXT NOT NULL DEFAULT 'Apto'");
  addColumnIfMissing('matches', 'championship', "TEXT NOT NULL DEFAULT 'Copa Sul Riograndense 2026'");
  addColumnIfMissing('matches', 'time', "TEXT NOT NULL DEFAULT '20:00'");
  addColumnIfMissing('registrations', 'email', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing('registrations', 'phone', "TEXT NOT NULL DEFAULT ''");
  // As credenciais coletivas antigas nao sao mais validas.
  db.prepare('DELETE FROM team_panels').run();
}

function seedIfEmpty() {
  const hasData = db.prepare('SELECT COUNT(*) AS total FROM championships').get().total > 0;
  if (hasData) return;

  const insertChampionship = db.prepare(`
    INSERT INTO championships (name, category, status, teams_limit, teams_count)
    VALUES (@name, @category, @status, @teamsLimit, @teamsCount)
  `);
  const insertTeam = db.prepare(`
    INSERT INTO teams (name, city, coach, athletes)
    VALUES (@name, @city, @coach, @athletes)
  `);
  const insertAthlete = db.prepare(`
    INSERT INTO athletes (name, team, goals, yellow_cards, red_cards, rating)
    VALUES (@name, @team, @goals, @yellowCards, @redCards, @rating)
  `);
  const insertMatch = db.prepare(`
    INSERT INTO matches (round, home_team, away_team, score, venue, date, status)
    VALUES (@round, @homeTeam, @awayTeam, @score, @venue, @date, @status)
  `);
  const insertRegistration = db.prepare(`
    INSERT INTO registrations (team_name, responsible, category, status)
    VALUES (@teamName, @responsible, @category, @status)
  `);
  const insertSponsor = db.prepare(`
    INSERT INTO sponsors (name, tier)
    VALUES (@name, @tier)
  `);
  const insertNews = db.prepare(`
    INSERT INTO news (title, tag)
    VALUES (@title, @tag)
  `);

  const seed = db.transaction(() => {
    [
      { name: 'Copa Sul Riograndense 2026', category: 'Adulto Masculino', status: 'Em andamento', teamsLimit: 16, teamsCount: 12 },
      { name: 'Liga Regional Sub-20', category: 'Sub-20', status: 'Inscricoes abertas', teamsLimit: 12, teamsCount: 6 },
      { name: 'Festival Feminino LSRDF', category: 'Adulto Feminino', status: 'Planejamento', teamsLimit: 10, teamsCount: 0 }
    ].forEach((item) => insertChampionship.run(item));

    [
      { name: 'Avenida Futsal', city: 'Santa Cruz do Sul', coach: 'Marcos Vieira', athletes: 14 },
      { name: 'Atlético Vale', city: 'Lajeado', coach: 'Rafael Torres', athletes: 12 },
      { name: 'União do Sul', city: 'Rio Pardo', coach: 'Leandro Pires', athletes: 13 },
      { name: 'Real Centro', city: 'Cachoeira do Sul', coach: 'André Lopes', athletes: 11 }
    ].forEach((item) => insertTeam.run(item));

    [
      { name: 'Gustavo Moraes', team: 'Avenida Futsal', goals: 11, yellowCards: 2, redCards: 0, rating: 8.9 },
      { name: 'Felipe Nunes', team: 'Atlético Vale', goals: 9, yellowCards: 1, redCards: 0, rating: 8.4 },
      { name: 'Caio Ferraz', team: 'União do Sul', goals: 8, yellowCards: 3, redCards: 1, rating: 8.1 },
      { name: 'Bruno Ribeiro', team: 'Real Centro', goals: 7, yellowCards: 2, redCards: 0, rating: 7.9 }
    ].forEach((item) => insertAthlete.run(item));

    [
      { round: 'Rodada 4', homeTeam: 'Avenida Futsal', awayTeam: 'Atlético Vale', score: '4 x 2', venue: 'Ginásio Municipal', date: '2026-07-24', status: 'Agendado' },
      { round: 'Rodada 4', homeTeam: 'União do Sul', awayTeam: 'Real Centro', score: '-', venue: 'Complexo LSRDF', date: '2026-07-25', status: 'Agendado' },
      { round: 'Semifinal', homeTeam: 'Avenida Futsal', awayTeam: 'União do Sul', score: '-', venue: 'Ginásio Municipal', date: '2026-08-01', status: 'Previsto' }
    ].forEach((item) => insertMatch.run(item));

    [
      { teamName: 'SER Serrana', responsible: 'Daniel Martins', category: 'Adulto Masculino', status: 'Em analise' },
      { teamName: 'Fênix Futsal', responsible: 'Ana Costa', category: 'Adulto Feminino', status: 'Documentos pendentes' },
      { teamName: 'Base Sul', responsible: 'Priscila Duarte', category: 'Sub-20', status: 'Aprovada' }
    ].forEach((item) => insertRegistration.run(item));

    [
      { name: 'Esporte Total', tier: 'Master' },
      { name: 'Clínica Movimento', tier: 'Parceiro' },
      { name: 'Rádio Regional', tier: 'Midia' }
    ].forEach((item) => insertSponsor.run(item));

    [
      { title: 'Copa Sul Riograndense confirma rodada dupla no sábado', tag: 'Competicao' },
      { title: 'Inscrições Sub-20 seguem abertas até sexta-feira', tag: 'Inscricoes' },
      { title: 'LSRDF divulga ranking parcial de atletas', tag: 'Estatisticas' }
    ].forEach((item) => insertNews.run(item));
  });

  seed();
}

function seedFeatureTablesIfEmpty() {
  if (db.prepare('SELECT COUNT(*) AS total FROM categories').get().total === 0) {
    [
      ['Adulto Masculino', 'Masculino', 'Livre'],
      ['Adulto Feminino', 'Feminino', 'Livre'],
      ['Sub-20', 'Masculino', 'Ate 20 anos']
    ].forEach(([name, gender, ageLimit]) => {
      db.prepare('INSERT INTO categories (name, gender, age_limit) VALUES (?, ?, ?)').run(name, gender, ageLimit);
    });
  }

  if (db.prepare('SELECT COUNT(*) AS total FROM referees').get().total === 0) {
    [
      ['Carlos Mendes', 'Santa Cruz do Sul', '(51) 99999-0101', 'Ativo'],
      ['Juliana Rocha', 'Lajeado', '(51) 99999-0202', 'Ativo']
    ].forEach((item) => {
      db.prepare('INSERT INTO referees (name, city, phone, status) VALUES (?, ?, ?, ?)').run(...item);
    });
  }

  if (db.prepare('SELECT COUNT(*) AS total FROM venues').get().total === 0) {
    [
      ['Ginasio Municipal', 'Santa Cruz do Sul', 'Rua Central, 120', 1800],
      ['Complexo LSRDF', 'Rio Pardo', 'Av. do Esporte, 88', 1200]
    ].forEach((item) => {
      db.prepare('INSERT INTO venues (name, city, address, capacity) VALUES (?, ?, ?, ?)').run(...item);
    });
  }

  if (db.prepare('SELECT COUNT(*) AS total FROM documents').get().total === 0) {
    [
      ['Equipe', 'SER Serrana', 'Ficha de inscricao', 'Em analise', null],
      ['Atleta', 'Gustavo Moraes', 'Documento de identidade', 'Aprovado', null],
      ['Jogo', 'Avenida Futsal x Atletico Vale', 'Sumula pos-jogo', 'Recebido', null]
    ].forEach((item) => {
      db.prepare(`
        INSERT INTO documents (owner_type, owner_name, document_type, status, file_url)
        VALUES (?, ?, ?, ?, ?)
      `).run(...item);
    });
  }

  if (db.prepare('SELECT COUNT(*) AS total FROM suspensions').get().total === 0) {
    db.prepare(`
      INSERT INTO suspensions (athlete, team, reason, matches_left, status)
      VALUES ('Caio Ferraz', 'Uniao do Sul', 'Cartao vermelho direto', 1, 'Ativa')
    `).run();
  }

  if (db.prepare('SELECT COUNT(*) AS total FROM broadcasts').get().total === 0) {
    db.prepare(`
      INSERT INTO broadcasts (match_id, platform, url)
      VALUES (1, 'YouTube', 'https://youtube.com/@lsrdf')
    `).run();
  }

  if (db.prepare('SELECT COUNT(*) AS total FROM round_selections').get().total === 0) {
    db.prepare(`
      INSERT INTO round_selections (round, athlete, team, note)
      VALUES ('Rodada 3', 'Gustavo Moraes', 'Avenida Futsal', 'Destaque ofensivo da rodada')
    `).run();
  }

  if (db.prepare('SELECT COUNT(*) AS total FROM team_staff').get().total === 0) {
    [
      ['Avenida Futsal', 'Marcos Vieira', 'Treinador', '', 'Ativo'],
      ['Avenida Futsal', 'Rafael Torres', 'Preparador Fisico', '', 'Ativo'],
      ['Atlético Vale', 'Giam Santos', 'Treinador', '', 'Ativo'],
      ['Atlético Vale', 'Cleiton Silveira', 'Massagista', '', 'Ativo'],
      ['União do Sul', 'Leandro Pires', 'Treinador', '', 'Ativo'],
      ['Real Centro', 'Andre Lopes', 'Treinador', '', 'Ativo']
    ].forEach((item) => {
      db.prepare(`
        INSERT INTO team_staff (team, name, role, document, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(...item);
    });
  }

  [
    ['0011', '10', 'Linha', 'Apto', 'Gustavo Moraes'],
    ['0012', '9', 'Linha', 'Apto', 'Felipe Nunes'],
    ['0013', '7', 'Linha', 'Suspenso', 'Caio Ferraz'],
    ['0014', '1', 'Goleiro', 'Apto', 'Bruno Ribeiro']
  ].forEach((item) => {
    db.prepare(`
      UPDATE athletes
      SET document = ?, jersey_number = ?, position = ?, registration_status = ?
      WHERE name = ? AND document = ''
    `).run(...item);
  });
}

export function rows(statement, params) {
  const prepared = db.prepare(statement);
  return params === undefined ? prepared.all() : prepared.all(params);
}

export function row(statement, params) {
  const prepared = db.prepare(statement);
  return params === undefined ? prepared.get() : prepared.get(params);
}
