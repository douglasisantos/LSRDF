import { db, row, rows } from './db.js';

const mapChampionship = (item) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  status: item.status,
  teamsLimit: item.teams_limit,
  teamsCount: item.teams_count
});

const mapAthlete = (item) => ({
  id: item.id,
  name: item.name,
  team: item.team,
  goals: item.goals,
  yellowCards: item.yellow_cards,
  redCards: item.red_cards,
  rating: item.rating,
  document: item.document,
  jerseyNumber: item.jersey_number,
  position: item.position,
  registrationStatus: item.registration_status
});

const mapMatch = (item) => ({
  id: item.id,
  round: item.round,
  homeTeam: item.home_team,
  awayTeam: item.away_team,
  score: item.score,
  venue: item.venue,
  date: item.date,
  time: item.time,
  championship: item.championship,
  status: item.status
});

const mapTeam = (item) => ({
  id: item.id,
  name: item.name,
  city: item.city,
  coach: item.coach,
  athletes: item.athletes
});

const mapRegistration = (item) => ({
  id: item.id,
  teamName: item.team_name,
  responsible: item.responsible,
  email: item.email,
  phone: item.phone,
  category: item.category,
  status: item.status
});

const mapCategory = (item) => ({
  id: item.id,
  name: item.name,
  gender: item.gender,
  ageLimit: item.age_limit
});

const mapReferee = (item) => ({
  id: item.id,
  name: item.name,
  city: item.city,
  phone: item.phone,
  status: item.status
});

const mapVenue = (item) => ({
  id: item.id,
  name: item.name,
  city: item.city,
  address: item.address,
  capacity: item.capacity
});

const mapDocument = (item) => ({
  id: item.id,
  ownerType: item.owner_type,
  ownerName: item.owner_name,
  documentType: item.document_type,
  status: item.status,
  fileUrl: item.file_url
});

const mapSuspension = (item) => ({
  id: item.id,
  athlete: item.athlete,
  team: item.team,
  reason: item.reason,
  matchesLeft: item.matches_left,
  status: item.status
});

const mapBroadcast = (item) => ({
  id: item.id,
  matchId: item.match_id,
  platform: item.platform,
  url: item.url
});

const mapRoundSelection = (item) => ({
  id: item.id,
  round: item.round,
  athlete: item.athlete,
  team: item.team,
  note: item.note
});

const mapTeamPanel = (item) => ({
  id: item.id,
  teamName: item.team_name,
  login: item.login,
  status: item.status
});

const mapTeamStaff = (item) => ({
  id: item.id,
  team: item.team,
  name: item.name,
  role: item.role,
  document: item.document,
  status: item.status
});

const mapMatchSheet = (item) => ({
  id: item.id,
  matchId: item.match_id,
  report: item.report,
  firstHalfStart: item.first_half_start,
  firstHalfEnd: item.first_half_end,
  secondHalfStart: item.second_half_start,
  secondHalfEnd: item.second_half_end,
  extraPeriod: item.extra_period,
  status: item.status
});

export function getOverview() {
  const championships = row('SELECT COUNT(*) AS total FROM championships').total;
  const teams = row('SELECT COUNT(*) AS total FROM teams').total;
  const athletes = row('SELECT COALESCE(SUM(athletes), 0) AS total FROM teams').total;
  const matches = row('SELECT COUNT(*) AS total FROM matches').total;
  const pendingRegistrations = row(`
    SELECT COUNT(*) AS total
    FROM registrations
    WHERE status != 'Aprovada'
  `).total;

  return { championships, teams, athletes, matches, pendingRegistrations };
}

export function getChampionships() {
  return rows('SELECT * FROM championships ORDER BY id DESC').map(mapChampionship);
}

export function createChampionship(input) {
  const result = db.prepare(`
    INSERT INTO championships (name, category, status, teams_limit, teams_count)
    VALUES (@name, @category, @status, @teamsLimit, 0)
  `).run(input);

  return mapChampionship(row('SELECT * FROM championships WHERE id = ?', result.lastInsertRowid));
}

export function getTeams() {
  return rows('SELECT * FROM teams ORDER BY name').map(mapTeam);
}

export function createTeam(input) {
  const result = db.prepare(`
    INSERT INTO teams (name, city, coach, athletes)
    VALUES (@name, @city, @coach, @athletes)
  `).run(input);

  return mapTeam(row('SELECT * FROM teams WHERE id = ?', result.lastInsertRowid));
}

export function getAthletes() {
  return rows('SELECT * FROM athletes ORDER BY goals DESC, rating DESC').map(mapAthlete);
}

export function createAthlete(input) {
  const result = db.prepare(`
    INSERT INTO athletes (name, team, goals, yellow_cards, red_cards, rating, document, jersey_number, position, registration_status)
    VALUES (@name, @team, 0, 0, 0, 0, @document, @jerseyNumber, @position, @registrationStatus)
  `).run(input);

  db.prepare('UPDATE teams SET athletes = athletes + 1 WHERE name = ?').run(input.team);
  return mapAthlete(row('SELECT * FROM athletes WHERE id = ?', result.lastInsertRowid));
}

export function getMatches() {
  return rows('SELECT * FROM matches ORDER BY date ASC').map(mapMatch);
}

export function createMatch(input) {
  const result = db.prepare(`
    INSERT INTO matches (round, home_team, away_team, score, venue, date, status, championship, time)
    VALUES (@round, @homeTeam, @awayTeam, '-', @venue, @date, @status, @championship, @time)
  `).run(input);

  return mapMatch(row('SELECT * FROM matches WHERE id = ?', result.lastInsertRowid));
}

export function updateMatchScore(id, input) {
  const score = `${input.homeGoals} x ${input.awayGoals}`;
  db.prepare(`
    UPDATE matches
    SET score = ?, status = 'Finalizado'
    WHERE id = ?
  `).run(score, id);

  if (input.homeScorer) {
    db.prepare('UPDATE athletes SET goals = goals + ? WHERE name = ?').run(Number(input.homeGoals || 0), input.homeScorer);
  }
  if (input.awayScorer) {
    db.prepare('UPDATE athletes SET goals = goals + ? WHERE name = ?').run(Number(input.awayGoals || 0), input.awayScorer);
  }

  return mapMatch(row('SELECT * FROM matches WHERE id = ?', id));
}

export function generateRound(input) {
  const teamNames = getTeams().map((team) => team.name);
  const venue = input.venue || 'Complexo LSRDF';
  const date = input.date;
  const roundName = input.round || 'Rodada gerada';
  const created = [];

  for (let index = 0; index < teamNames.length - 1; index += 2) {
    const result = db.prepare(`
      INSERT INTO matches (round, home_team, away_team, score, venue, date, status, championship, time)
      VALUES (?, ?, ?, '-', ?, ?, 'Agendado', 'Copa Sul Riograndense 2026', '20:00')
    `).run(roundName, teamNames[index], teamNames[index + 1], venue, date);
    created.push(mapMatch(row('SELECT * FROM matches WHERE id = ?', result.lastInsertRowid)));
  }

  return created;
}

export function getRegistrations() {
  return rows('SELECT * FROM registrations ORDER BY id DESC').map(mapRegistration);
}

export function createRegistration(input) {
  const result = db.prepare(`
    INSERT INTO registrations (team_name, responsible, email, phone, category, status)
    VALUES (@teamName, @responsible, @email, @phone, @category, 'Em analise')
  `).run(input);

  return mapRegistration(row('SELECT * FROM registrations WHERE id = ?', result.lastInsertRowid));
}

export function updateRegistrationStatus(id, status) {
  db.prepare('UPDATE registrations SET status = ? WHERE id = ?').run(status, id);
  return mapRegistration(row('SELECT * FROM registrations WHERE id = ?', id));
}

export function getSponsors() {
  return rows('SELECT * FROM sponsors ORDER BY id').map((item) => ({
    id: item.id,
    name: item.name,
    tier: item.tier
  }));
}

export function createSponsor(input) {
  const result = db.prepare('INSERT INTO sponsors (name, tier) VALUES (@name, @tier)').run(input);
  return row('SELECT * FROM sponsors WHERE id = ?', result.lastInsertRowid);
}

export function getNews() {
  return rows('SELECT * FROM news ORDER BY published_at DESC, id DESC').map((item) => ({
    id: item.id,
    title: item.title,
    tag: item.tag,
    publishedAt: item.published_at
  }));
}

export function createNews(input) {
  const result = db.prepare('INSERT INTO news (title, tag) VALUES (@title, @tag)').run(input);
  return getNews().find((item) => item.id === result.lastInsertRowid);
}

export function getCategories() {
  return rows('SELECT * FROM categories ORDER BY name').map(mapCategory);
}

export function createCategory(input) {
  const result = db.prepare(`
    INSERT INTO categories (name, gender, age_limit)
    VALUES (@name, @gender, @ageLimit)
  `).run(input);
  return mapCategory(row('SELECT * FROM categories WHERE id = ?', result.lastInsertRowid));
}

export function getReferees() {
  return rows('SELECT * FROM referees ORDER BY name').map(mapReferee);
}

export function createReferee(input) {
  const result = db.prepare(`
    INSERT INTO referees (name, city, phone, status)
    VALUES (@name, @city, @phone, 'Ativo')
  `).run(input);
  return mapReferee(row('SELECT * FROM referees WHERE id = ?', result.lastInsertRowid));
}

export function getVenues() {
  return rows('SELECT * FROM venues ORDER BY name').map(mapVenue);
}

export function createVenue(input) {
  const result = db.prepare(`
    INSERT INTO venues (name, city, address, capacity)
    VALUES (@name, @city, @address, @capacity)
  `).run(input);
  return mapVenue(row('SELECT * FROM venues WHERE id = ?', result.lastInsertRowid));
}

export function getDocuments() {
  return rows('SELECT * FROM documents ORDER BY id DESC').map(mapDocument);
}

export function createDocument(input) {
  const result = db.prepare(`
    INSERT INTO documents (owner_type, owner_name, document_type, status, file_url)
    VALUES (@ownerType, @ownerName, @documentType, @status, @fileUrl)
  `).run(input);
  return mapDocument(row('SELECT * FROM documents WHERE id = ?', result.lastInsertRowid));
}

export function getSuspensions() {
  return rows('SELECT * FROM suspensions ORDER BY id DESC').map(mapSuspension);
}

export function createSuspension(input) {
  const result = db.prepare(`
    INSERT INTO suspensions (athlete, team, reason, matches_left, status)
    VALUES (@athlete, @team, @reason, @matchesLeft, 'Ativa')
  `).run(input);
  return mapSuspension(row('SELECT * FROM suspensions WHERE id = ?', result.lastInsertRowid));
}

export function getBroadcasts() {
  return rows('SELECT * FROM broadcasts ORDER BY id DESC').map(mapBroadcast);
}

export function createBroadcast(input) {
  const result = db.prepare(`
    INSERT INTO broadcasts (match_id, platform, url)
    VALUES (@matchId, @platform, @url)
  `).run(input);
  return mapBroadcast(row('SELECT * FROM broadcasts WHERE id = ?', result.lastInsertRowid));
}

export function getRoundSelections() {
  return rows('SELECT * FROM round_selections ORDER BY id DESC').map(mapRoundSelection);
}

export function createRoundSelection(input) {
  const result = db.prepare(`
    INSERT INTO round_selections (round, athlete, team, note)
    VALUES (@round, @athlete, @team, @note)
  `).run(input);
  return mapRoundSelection(row('SELECT * FROM round_selections WHERE id = ?', result.lastInsertRowid));
}

export function getTeamPanels() {
  return rows('SELECT * FROM team_panels ORDER BY team_name').map(mapTeamPanel);
}

export function getTeamStaff() {
  return rows('SELECT * FROM team_staff ORDER BY team, role, name').map(mapTeamStaff);
}

export function createTeamStaff(input) {
  const result = db.prepare(`
    INSERT INTO team_staff (team, name, role, document, status)
    VALUES (@team, @name, @role, @document, 'Ativo')
  `).run(input);
  return mapTeamStaff(row('SELECT * FROM team_staff WHERE id = ?', result.lastInsertRowid));
}

function ensureMatchSheet(matchId) {
  const existing = row('SELECT * FROM match_sheets WHERE match_id = ?', matchId);
  if (existing) return existing;

  const result = db.prepare('INSERT INTO match_sheets (match_id) VALUES (?)').run(matchId);
  return row('SELECT * FROM match_sheets WHERE id = ?', result.lastInsertRowid);
}

export function updateMatchSheet(matchId, input) {
  ensureMatchSheet(matchId);
  db.prepare(`
    UPDATE match_sheets
    SET report = @report,
        first_half_start = @firstHalfStart,
        first_half_end = @firstHalfEnd,
        second_half_start = @secondHalfStart,
        second_half_end = @secondHalfEnd,
        extra_period = @extraPeriod,
        status = @status
    WHERE match_id = @matchId
  `).run({ ...input, matchId });
  return getMatchSheet(matchId).sheet;
}

export function getMatchSheet(matchId) {
  const match = mapMatch(row('SELECT * FROM matches WHERE id = ?', matchId));
  const sheet = mapMatchSheet(ensureMatchSheet(matchId));
  const homeAthletes = rows('SELECT * FROM athletes WHERE team = ? ORDER BY CAST(jersey_number AS INTEGER), name', match.homeTeam).map(mapAthlete);
  const awayAthletes = rows('SELECT * FROM athletes WHERE team = ? ORDER BY CAST(jersey_number AS INTEGER), name', match.awayTeam).map(mapAthlete);
  const homeStaff = rows('SELECT * FROM team_staff WHERE team = ? ORDER BY role, name', match.homeTeam).map(mapTeamStaff);
  const awayStaff = rows('SELECT * FROM team_staff WHERE team = ? ORDER BY role, name', match.awayTeam).map(mapTeamStaff);
  const referees = getReferees();

  return {
    match,
    sheet,
    homeAthletes,
    awayAthletes,
    homeStaff,
    awayStaff,
    referees
  };
}
