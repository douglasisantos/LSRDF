import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

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
  teamPanels: [],
  teamStaff: [
    { id: 1, team: 'Avenida Futsal', name: 'Marcos Vieira', role: 'Treinador', document: '', status: 'Ativo' },
    { id: 2, team: 'Avenida Futsal', name: 'Rafael Torres', role: 'Preparador Fisico', document: '', status: 'Ativo' },
    { id: 3, team: 'Atletico Vale', name: 'Giam Santos', role: 'Treinador', document: '', status: 'Ativo' }
  ]
};

async function getJson(path) {
  const token = sessionStorage.getItem('lsrdf_session');
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    throw new Error(`Erro ao carregar ${path}`);
  }
  return response.json();
}

async function sendJson(path, method, body) {
  const token = sessionStorage.getItem('lsrdf_session');
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
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
    ...fallbackData,
    registrations: [],
    referees: [],
    documents: [],
    suspensions: [],
    teamPanels: [],
    teamStaff: []
  }),
  actions: {
    async load() {
      this.loading = true;
      this.offline = false;
      try {
        const auth = useAuthStore();
        const publicEndpoints = {
          overview: '/api/overview', championships: '/api/championships', teams: '/api/teams',
          athletes: '/api/athletes', matches: '/api/matches', sponsors: '/api/sponsors',
          news: '/api/news', categories: '/api/categories', venues: '/api/venues',
          broadcasts: '/api/broadcasts', roundSelections: '/api/round-selections'
        };
        const representativeEndpoints = {
          registrations: '/api/registrations', documents: '/api/documents', teamStaff: '/api/team-staff'
        };
        const staffEndpoints = {
          ...representativeEndpoints, referees: '/api/referees', suspensions: '/api/suspensions',
          teamPanels: '/api/team-panels'
        };
        const endpoints = {
          ...publicEndpoints,
          ...(auth.isRepresentative ? representativeEndpoints : {}),
          ...(auth.isStaff ? staffEndpoints : {})
        };
        const results = await Promise.all(Object.entries(endpoints).map(async ([key, path]) => [key, await getJson(path)]));
        results.forEach(([key, value]) => { this[key] = value; });
        if (!auth.isAuthenticated) {
          this.registrations = [];
          this.documents = [];
          this.referees = [];
          this.suspensions = [];
          this.teamPanels = [];
          this.teamStaff = [];
        }
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
