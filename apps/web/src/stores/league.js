import { defineStore } from 'pinia';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

const fallbackData = {
  overview: {
    championships: 3,
    teams: 18,
    athletes: 216,
    matches: 42,
    pendingRegistrations: 7
  },
  championships: [
    { id: 1, name: 'Copa Sul Riograndense 2026', category: 'Adulto Masculino', status: 'Em andamento', teamsLimit: 16, teamsCount: 12 },
    { id: 2, name: 'Liga Regional Sub-20', category: 'Sub-20', status: 'Inscricoes abertas', teamsLimit: 12, teamsCount: 6 },
    { id: 3, name: 'Festival Feminino LSRDF', category: 'Adulto Feminino', status: 'Planejamento', teamsLimit: 10, teamsCount: 0 }
  ],
  teams: [
    { id: 1, name: 'Avenida Futsal', city: 'Santa Cruz do Sul', coach: 'Marcos Vieira', athletes: 14 },
    { id: 2, name: 'Atlético Vale', city: 'Lajeado', coach: 'Rafael Torres', athletes: 12 },
    { id: 3, name: 'União do Sul', city: 'Rio Pardo', coach: 'Leandro Pires', athletes: 13 }
  ],
  athletes: [
    { id: 1, name: 'Gustavo Moraes', team: 'Avenida Futsal', goals: 11, yellowCards: 2, redCards: 0, rating: 8.9 },
    { id: 2, name: 'Felipe Nunes', team: 'Atlético Vale', goals: 9, yellowCards: 1, redCards: 0, rating: 8.4 },
    { id: 3, name: 'Caio Ferraz', team: 'União do Sul', goals: 8, yellowCards: 3, redCards: 1, rating: 8.1 }
  ],
  matches: [
    { id: 1, round: 'Rodada 4', homeTeam: 'Avenida Futsal', awayTeam: 'Atlético Vale', score: '4 x 2', venue: 'Ginásio Municipal', date: '2026-07-24', status: 'Agendado' },
    { id: 2, round: 'Rodada 4', homeTeam: 'União do Sul', awayTeam: 'Real Centro', score: '-', venue: 'Complexo LSRDF', date: '2026-07-25', status: 'Agendado' }
  ],
  registrations: [
    { id: 1, teamName: 'SER Serrana', responsible: 'Daniel Martins', category: 'Adulto Masculino', status: 'Em analise' },
    { id: 2, teamName: 'Fênix Futsal', responsible: 'Ana Costa', category: 'Adulto Feminino', status: 'Documentos pendentes' }
  ],
  sponsors: [
    { id: 1, name: 'Esporte Total', tier: 'Master' },
    { id: 2, name: 'Clínica Movimento', tier: 'Parceiro' }
  ],
  news: [
    { id: 1, title: 'Copa Sul Riograndense confirma rodada dupla no sábado', tag: 'Competicao' },
    { id: 2, title: 'Inscrições Sub-20 seguem abertas até sexta-feira', tag: 'Inscricoes' }
  ],
  categories: [
    { id: 1, name: 'Adulto Masculino', gender: 'Masculino', ageLimit: 'Livre' },
    { id: 2, name: 'Adulto Feminino', gender: 'Feminino', ageLimit: 'Livre' },
    { id: 3, name: 'Sub-20', gender: 'Masculino', ageLimit: 'Ate 20 anos' }
  ],
  referees: [
    { id: 1, name: 'Carlos Mendes', city: 'Santa Cruz do Sul', phone: '(51) 99999-0101', status: 'Ativo' },
    { id: 2, name: 'Juliana Rocha', city: 'Lajeado', phone: '(51) 99999-0202', status: 'Ativo' }
  ],
  venues: [
    { id: 1, name: 'Ginasio Municipal', city: 'Santa Cruz do Sul', address: 'Rua Central, 120', capacity: 1800 },
    { id: 2, name: 'Complexo LSRDF', city: 'Rio Pardo', address: 'Av. do Esporte, 88', capacity: 1200 }
  ],
  documents: [
    { id: 1, ownerType: 'Jogo', ownerName: 'Rodada 4: Avenida Futsal x Atletico Vale', documentType: 'Sumula pos-jogo', status: 'Recebido', fileUrl: '' }
  ],
  suspensions: [
    { id: 1, athlete: 'Caio Ferraz', team: 'Uniao do Sul', reason: 'Cartao vermelho direto', matchesLeft: 1, status: 'Ativa' }
  ],
  broadcasts: [
    { id: 1, matchId: 1, platform: 'YouTube', url: 'https://youtube.com/@lsrdf' }
  ],
  roundSelections: [
    { id: 1, round: 'Rodada 3', athlete: 'Gustavo Moraes', team: 'Avenida Futsal', note: 'Destaque ofensivo da rodada' }
  ],
  teamPanels: [
    { id: 1, teamName: 'Avenida Futsal', login: 'avenida.futsal', temporaryPassword: 'LSRDF-2026', status: 'Ativo' },
    { id: 2, teamName: 'Atletico Vale', login: 'atletico.vale', temporaryPassword: 'LSRDF-2026', status: 'Ativo' }
  ],
  teamStaff: [
    { id: 1, team: 'Avenida Futsal', name: 'Marcos Vieira', role: 'Treinador', document: '', status: 'Ativo' },
    { id: 2, team: 'Avenida Futsal', name: 'Rafael Torres', role: 'Preparador Fisico', document: '', status: 'Ativo' },
    { id: 3, team: 'Atletico Vale', name: 'Giam Santos', role: 'Treinador', document: '', status: 'Ativo' }
  ]
};

async function getJson(path) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Erro ao carregar ${path}`);
  }
  return response.json();
}

async function sendJson(path, method, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Erro ao enviar ${path}`);
  }
  return response.json();
}

export const useLeagueStore = defineStore('league', {
  state: () => ({
    loading: false,
    offline: false,
    ...fallbackData
  }),
  actions: {
    async load() {
      this.loading = true;
      this.offline = false;
      try {
        const [
          overview,
          championships,
          teams,
          athletes,
          matches,
          registrations,
          sponsors,
          news,
          categories,
          referees,
          venues,
          documents,
          suspensions,
          broadcasts,
          roundSelections,
          teamPanels,
          teamStaff
        ] = await Promise.all([
          getJson('/api/overview'),
          getJson('/api/championships'),
          getJson('/api/teams'),
          getJson('/api/athletes'),
          getJson('/api/matches'),
          getJson('/api/registrations'),
          getJson('/api/sponsors'),
          getJson('/api/news'),
          getJson('/api/categories'),
          getJson('/api/referees'),
          getJson('/api/venues'),
          getJson('/api/documents'),
          getJson('/api/suspensions'),
          getJson('/api/broadcasts'),
          getJson('/api/round-selections'),
          getJson('/api/team-panels'),
          getJson('/api/team-staff')
        ]);

        this.overview = overview;
        this.championships = championships;
        this.teams = teams;
        this.athletes = athletes;
        this.matches = matches;
        this.registrations = registrations;
        this.sponsors = sponsors;
        this.news = news;
        this.categories = categories;
        this.referees = referees;
        this.venues = venues;
        this.documents = documents;
        this.suspensions = suspensions;
        this.broadcasts = broadcasts;
        this.roundSelections = roundSelections;
        this.teamPanels = teamPanels;
        this.teamStaff = teamStaff;
      } catch (error) {
        this.offline = true;
      } finally {
        this.loading = false;
      }
    },
    async create(path, body) {
      await sendJson(path, 'POST', body);
      await this.load();
    },
    async patch(path, body) {
      await sendJson(path, 'PATCH', body);
      await this.load();
    }
  }
});
