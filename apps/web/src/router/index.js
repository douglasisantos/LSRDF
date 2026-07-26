import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../pages/DashboardPage.vue';
import ManagementPage from '../pages/ManagementPage.vue';
import PublicPortalPage from '../pages/PublicPortalPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import LegalPage from '../pages/LegalPage.vue';
import AdminUsersPage from '../pages/AdminUsersPage.vue';
import PublicRegistrationPage from '../pages/PublicRegistrationPage.vue';
import { useAuthStore } from '../stores/auth';

const staff = { requiresAuth: true, roles: ['staff', 'admin'] };
const operational = { requiresAuth: true, roles: ['representative', 'staff', 'admin'] };

const routes = [
  { path: '/', name: 'dashboard', component: DashboardPage, alias: ['/resumo', '/dashboard'], meta: staff },
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
  { path: '/campeonatos', name: 'competitions', component: ManagementPage, props: { section: 'competitions' }, alias: ['/competicoes', '/categorias'], meta: staff },
  { path: '/times-atletas', name: 'teams', component: ManagementPage, props: { section: 'teams' }, alias: ['/times', '/atletas'], meta: operational },
  { path: '/jogos', name: 'matches', component: ManagementPage, props: { section: 'matches' }, alias: ['/rodadas', '/placares'], meta: staff },
  { path: '/sumulas', name: 'summaries', component: ManagementPage, props: { section: 'summaries' }, alias: ['/sumula'], meta: staff },
  { path: '/documentos', name: 'documents', component: ManagementPage, props: { section: 'documents' }, meta: operational },
  { path: '/inscricoes', name: 'registrations', component: ManagementPage, props: { section: 'registrations' }, alias: ['/inscricao'], meta: operational },
  { path: '/estrutura', name: 'structure', component: ManagementPage, props: { section: 'structure' }, meta: staff },
  { path: '/midia', name: 'media', component: ManagementPage, props: { section: 'media' }, alias: ['/noticias', '/transmissoes'], meta: staff },
  { path: '/portal', name: 'portal', component: PublicPortalPage, alias: ['/portal-publico'] },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/privacidade', name: 'privacy', component: LegalPage },
  { path: '/termos', name: 'terms', component: LegalPage },
  { path: '/inscrever-equipe', name: 'public-registration', component: PublicRegistrationPage },
  { path: '/usuarios', name: 'users', component: AdminUsersPage, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.ready) await auth.restore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } };
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return auth.isRepresentative ? '/times-atletas' : '/portal';
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return auth.isStaff ? '/' : auth.isRepresentative ? '/times-atletas' : '/portal';
  }
});

export default router;
