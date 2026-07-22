import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../pages/DashboardPage.vue';
import ManagementPage from '../pages/ManagementPage.vue';
import PublicPortalPage from '../pages/PublicPortalPage.vue';

const routes = [
  { path: '/', name: 'dashboard', component: DashboardPage, alias: ['/resumo', '/dashboard'] },
  {
    path: '/gestao',
    redirect: (to) => {
      if (to.query.document === 'sumula') return { path: '/sumulas', query: to.query };
      if (to.query.tab === 'teams') return '/times-atletas';
      if (to.query.tab === 'matches') return '/jogos';
      if (to.query.tab === 'operations') return '/inscricoes';
      if (to.query.tab === 'content') return '/midia';
      return '/campeonatos';
    }
  },
  { path: '/campeonatos', name: 'competitions', component: ManagementPage, props: { section: 'competitions' }, alias: ['/competicoes', '/categorias'] },
  { path: '/times-atletas', name: 'teams', component: ManagementPage, props: { section: 'teams' }, alias: ['/times', '/atletas'] },
  { path: '/jogos', name: 'matches', component: ManagementPage, props: { section: 'matches' }, alias: ['/rodadas', '/placares'] },
  { path: '/sumulas', name: 'summaries', component: ManagementPage, props: { section: 'summaries' }, alias: ['/sumula'] },
  { path: '/documentos', name: 'documents', component: ManagementPage, props: { section: 'documents' } },
  { path: '/inscricoes', name: 'registrations', component: ManagementPage, props: { section: 'registrations' }, alias: ['/inscricao'] },
  { path: '/estrutura', name: 'structure', component: ManagementPage, props: { section: 'structure' } },
  { path: '/midia', name: 'media', component: ManagementPage, props: { section: 'media' }, alias: ['/noticias', '/transmissoes'] },
  { path: '/portal', name: 'portal', component: PublicPortalPage, alias: ['/portal-publico'] },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

export default createRouter({
  history: createWebHistory(),
  routes
});
