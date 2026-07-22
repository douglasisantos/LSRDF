<template>
  <q-page class="module-page pb-10">
    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6">
        <div>
          <div class="flex items-center gap-2 text-sm font-bold uppercase text-league-red">
            <q-icon :name="sectionInfo.icon" />
            {{ sectionInfo.kicker }}
          </div>
          <h1 class="m-0 mt-1 text-2xl font-black text-league-navy md:text-3xl">{{ sectionInfo.title }}</h1>
        </div>
        <q-btn outline no-caps color="primary" icon="refresh" label="Atualizar" :loading="store.loading" @click="store.load" />
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6">
      <q-banner v-if="store.offline" class="mb-5 rounded-md bg-amber-50 text-amber-900">
        A API nao respondeu. A tela esta usando dados locais de demonstracao.
      </q-banner>

      <div v-if="section === 'competitions'" class="module-grid">
        <FormPanel title="Criar campeonato" icon="emoji_events" submit-label="Salvar campeonato" @submit="submit('/api/championships', championshipForm, resetChampionship)">
          <q-input v-model="championshipForm.name" outlined dense label="Nome" />
          <q-select v-model="championshipForm.category" outlined dense label="Categoria" :options="categoryOptions" />
          <q-select v-model="championshipForm.status" outlined dense label="Status" :options="statusOptions" />
          <q-input v-model.number="championshipForm.teamsLimit" outlined dense type="number" label="Limite de times" />
        </FormPanel>

        <DataPanel title="Campeonatos cadastrados">
          <q-table flat :rows="store.championships" :columns="championshipColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>

        <FormPanel title="Criar categoria" icon="category" submit-label="Salvar categoria" @submit="submit('/api/categories', categoryForm, resetCategory)">
          <q-input v-model="categoryForm.name" outlined dense label="Nome" />
          <q-select v-model="categoryForm.gender" outlined dense label="Genero" :options="['Masculino', 'Feminino', 'Misto']" />
          <q-input v-model="categoryForm.ageLimit" outlined dense label="Limite de idade" />
        </FormPanel>

        <DataPanel title="Categorias">
          <q-table flat :rows="store.categories" :columns="categoryColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>
      </div>

      <div v-else-if="section === 'teams'" class="module-grid">
        <FormPanel title="Cadastrar time" icon="groups" submit-label="Salvar time" @submit="submit('/api/teams', teamForm, resetTeam)">
          <q-input v-model="teamForm.name" outlined dense label="Nome do time" />
          <q-input v-model="teamForm.city" outlined dense label="Cidade" />
          <q-input v-model="teamForm.coach" outlined dense label="Treinador ou responsavel" />
          <q-input v-model.number="teamForm.athletes" outlined dense type="number" label="Atletas iniciais" />
        </FormPanel>

        <FormPanel title="Cadastrar atleta" icon="badge" submit-label="Salvar atleta" @submit="submit('/api/athletes', athleteForm, resetAthlete)">
          <q-input v-model="athleteForm.name" outlined dense label="Nome do atleta" />
          <q-select v-model="athleteForm.team" outlined dense label="Time" :options="teamOptions" />
          <q-input v-model="athleteForm.document" outlined dense label="Documento federativo" />
          <q-input v-model="athleteForm.jerseyNumber" outlined dense label="Numero da camisa" />
          <q-select v-model="athleteForm.position" outlined dense label="Funcao" :options="['Linha', 'Goleiro']" />
          <q-select v-model="athleteForm.registrationStatus" outlined dense label="Condicao" :options="['Apto', 'Suspenso', 'Pendente']" />
        </FormPanel>

        <FormPanel title="Comissao tecnica" icon="engineering" submit-label="Salvar membro" @submit="submit('/api/team-staff', staffForm, resetStaff)">
          <q-select v-model="staffForm.team" outlined dense label="Time" :options="teamOptions" />
          <q-input v-model="staffForm.name" outlined dense label="Nome" />
          <q-select v-model="staffForm.role" outlined dense label="Cargo" :options="staffRoleOptions" />
          <q-input v-model="staffForm.document" outlined dense label="Documento" />
        </FormPanel>

        <DataPanel title="Times">
          <q-table flat :rows="store.teams" :columns="teamColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>

        <DataPanel title="Atletas para sumula">
          <q-table flat :rows="store.athletes" :columns="athleteColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>

        <DataPanel title="Comissao tecnica">
          <q-table flat :rows="store.teamStaff" :columns="staffColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>

        <DataPanel title="Painel dos times">
          <q-table flat :rows="store.teamPanels" :columns="panelColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>
      </div>

      <div v-else-if="section === 'matches'" class="module-grid">
        <FormPanel title="Cadastrar jogo" icon="event" submit-label="Salvar jogo" @submit="submit('/api/matches', matchForm, resetMatch)">
          <q-select v-model="matchForm.championship" outlined dense label="Campeonato" :options="championshipOptions" />
          <q-input v-model="matchForm.round" outlined dense label="Rodada ou fase" />
          <q-select v-model="matchForm.homeTeam" outlined dense label="Mandante" :options="teamOptions" />
          <q-select v-model="matchForm.awayTeam" outlined dense label="Visitante" :options="teamOptions" />
          <q-select v-model="matchForm.venue" outlined dense label="Campo ou ginasio" :options="venueOptions" />
          <q-input v-model="matchForm.date" outlined dense type="date" label="Data" />
          <q-input v-model="matchForm.time" outlined dense type="time" label="Horario" />
          <q-select v-model="matchForm.status" outlined dense label="Status" :options="['Agendado', 'Previsto', 'Finalizado']" />
        </FormPanel>

        <FormPanel title="Gerar rodada automatica" icon="shuffle" submit-label="Gerar rodada" @submit="submit('/api/matches/generate-round', generatedRoundForm, resetGeneratedRound)">
          <q-input v-model="generatedRoundForm.round" outlined dense label="Nome da rodada" />
          <q-input v-model="generatedRoundForm.date" outlined dense type="date" label="Data" />
          <q-select v-model="generatedRoundForm.venue" outlined dense label="Campo ou ginasio" :options="venueOptions" />
        </FormPanel>

        <FormPanel title="Lancar placar" icon="scoreboard" submit-label="Atualizar placar" @submit="patch(`/api/matches/${scoreForm.matchId}/score`, scoreForm, resetScore)">
          <q-select v-model="scoreForm.matchId" outlined dense emit-value map-options label="Jogo" :options="matchOptions" />
          <q-input v-model.number="scoreForm.homeGoals" outlined dense type="number" label="Gols mandante" />
          <q-input v-model.number="scoreForm.awayGoals" outlined dense type="number" label="Gols visitante" />
          <q-select v-model="scoreForm.homeScorer" outlined dense clearable label="Artilheiro mandante" :options="athleteOptions" />
          <q-select v-model="scoreForm.awayScorer" outlined dense clearable label="Artilheiro visitante" :options="athleteOptions" />
        </FormPanel>

        <DataPanel title="Calendario de jogos">
          <q-table flat :rows="store.matches" :columns="matchColumns" row-key="id" :pagination="tablePagination">
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn dense outline no-caps color="primary" icon="description" label="Sumula" :to="{ path: '/sumulas', query: { matchId: props.row.id } }" />
                <q-btn dense flat round color="secondary" icon="picture_as_pdf" class="ml-1" @click="openSheetPdf(props.row.id)">
                  <q-tooltip>Gerar PDF da sumula</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </DataPanel>
      </div>

      <div v-else-if="section === 'summaries'" class="module-grid">
        <FormPanel title="Nova sumula" icon="description" submit-label="Salvar sumula" @submit="submitSummary">
          <q-select v-model="summaryForm.matchId" outlined dense emit-value map-options label="Jogo" :options="matchOptions" />
          <q-select v-model="summaryForm.documentType" outlined dense label="Tipo" :options="summaryTypeOptions" />
          <q-select v-model="summaryForm.status" outlined dense label="Status" :options="documentStatusOptions" />
          <q-input v-model="summaryForm.fileUrl" outlined dense label="URL do arquivo" />
        </FormPanel>

        <DataPanel title="Sumulas salvas">
          <q-table flat :rows="summaryDocuments" :columns="documentColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>

        <DataPanel title="Jogos disponiveis">
          <q-table flat :rows="store.matches" :columns="summaryMatchColumns" row-key="id" :pagination="tablePagination">
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn dense flat round color="primary" icon="add" @click="selectMatchForSummary(props.row)">
                  <q-tooltip>Selecionar jogo</q-tooltip>
                </q-btn>
                <q-btn dense flat round color="secondary" icon="picture_as_pdf" @click="openSheetPdf(props.row.id)">
                  <q-tooltip>Baixar PDF oficial</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </DataPanel>
      </div>

      <div v-else-if="section === 'documents'" class="module-grid">
        <FormPanel title="Novo documento" icon="folder" submit-label="Salvar documento" @submit="submit('/api/documents', documentForm, resetDocument)">
          <q-select v-model="documentForm.ownerType" outlined dense label="Vinculo" :options="['Equipe', 'Atleta']" />
          <q-select v-model="documentForm.ownerName" outlined dense use-input fill-input hide-selected new-value-mode="add-unique" label="Equipe ou atleta" :options="documentOwnerOptions" />
          <q-select v-model="documentForm.documentType" outlined dense label="Tipo" :options="documentTypeOptions" />
          <q-select v-model="documentForm.status" outlined dense label="Status" :options="documentStatusOptions" />
          <q-input v-model="documentForm.fileUrl" outlined dense label="URL do arquivo" />
        </FormPanel>

        <DataPanel title="Documentos salvos">
          <q-table flat :rows="regularDocuments" :columns="documentColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>
      </div>

      <div v-else-if="section === 'registrations'" class="module-grid">
        <FormPanel title="Inscricao por link" icon="how_to_reg" submit-label="Salvar inscricao" @submit="submit('/api/registrations', registrationForm, resetRegistration)">
          <q-input v-model="registrationForm.teamName" outlined dense label="Time" />
          <q-input v-model="registrationForm.responsible" outlined dense label="Responsavel" />
          <q-select v-model="registrationForm.category" outlined dense label="Categoria" :options="categoryOptions" />
        </FormPanel>

        <FormPanel title="Atualizar inscricao" icon="verified" submit-label="Atualizar status" @submit="patch(`/api/registrations/${registrationStatusForm.id}/status`, registrationStatusForm, resetRegistrationStatus)">
          <q-select v-model="registrationStatusForm.id" outlined dense emit-value map-options label="Inscricao" :options="registrationOptions" />
          <q-select v-model="registrationStatusForm.status" outlined dense label="Status" :options="['Aprovada', 'Em analise', 'Documentos pendentes', 'Reprovada']" />
        </FormPanel>

        <DataPanel title="Inscricoes">
          <q-table flat :rows="store.registrations" :columns="registrationColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>
      </div>

      <div v-else-if="section === 'structure'" class="module-grid">
        <FormPanel title="Cadastrar arbitro" icon="sports" submit-label="Salvar arbitro" @submit="submit('/api/referees', refereeForm, resetReferee)">
          <q-input v-model="refereeForm.name" outlined dense label="Nome" />
          <q-input v-model="refereeForm.city" outlined dense label="Cidade" />
          <q-input v-model="refereeForm.phone" outlined dense label="Telefone" />
        </FormPanel>

        <FormPanel title="Cadastrar campo ou ginasio" icon="stadium" submit-label="Salvar local" @submit="submit('/api/venues', venueForm, resetVenue)">
          <q-input v-model="venueForm.name" outlined dense label="Nome" />
          <q-input v-model="venueForm.city" outlined dense label="Cidade" />
          <q-input v-model="venueForm.address" outlined dense label="Endereco" />
          <q-input v-model.number="venueForm.capacity" outlined dense type="number" label="Capacidade" />
        </FormPanel>

        <FormPanel title="Suspensao manual" icon="gavel" submit-label="Salvar suspensao" @submit="submit('/api/suspensions', suspensionForm, resetSuspension)">
          <q-select v-model="suspensionForm.athlete" outlined dense label="Atleta" :options="athleteOptions" />
          <q-select v-model="suspensionForm.team" outlined dense label="Time" :options="teamOptions" />
          <q-input v-model="suspensionForm.reason" outlined dense label="Motivo" />
          <q-input v-model.number="suspensionForm.matchesLeft" outlined dense type="number" label="Jogos de suspensao" />
        </FormPanel>

        <DataPanel title="Arbitros">
          <q-table flat :rows="store.referees" :columns="refereeColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>

        <DataPanel title="Campos e ginasios">
          <q-table flat :rows="store.venues" :columns="venueColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>

        <DataPanel title="Suspensoes">
          <q-table flat :rows="store.suspensions" :columns="suspensionColumns" row-key="id" :pagination="tablePagination" />
        </DataPanel>
      </div>

      <div v-else-if="section === 'media'" class="module-grid">
        <FormPanel title="Link de transmissao" icon="live_tv" submit-label="Salvar link" @submit="submit('/api/broadcasts', broadcastForm, resetBroadcast)">
          <q-select v-model="broadcastForm.matchId" outlined dense emit-value map-options label="Jogo" :options="matchOptions" />
          <q-input v-model="broadcastForm.platform" outlined dense label="Plataforma" />
          <q-input v-model="broadcastForm.url" outlined dense label="URL" />
        </FormPanel>

        <FormPanel title="Selecao da rodada" icon="workspace_premium" submit-label="Salvar selecao" @submit="submit('/api/round-selections', selectionForm, resetSelection)">
          <q-input v-model="selectionForm.round" outlined dense label="Rodada" />
          <q-select v-model="selectionForm.athlete" outlined dense label="Atleta" :options="athleteOptions" />
          <q-select v-model="selectionForm.team" outlined dense label="Time" :options="teamOptions" />
          <q-input v-model="selectionForm.note" outlined dense label="Observacao" />
        </FormPanel>

        <FormPanel title="Patrocinador ou parceiro" icon="handshake" submit-label="Salvar patrocinador" @submit="submit('/api/sponsors', sponsorForm, resetSponsor)">
          <q-input v-model="sponsorForm.name" outlined dense label="Nome" />
          <q-select v-model="sponsorForm.tier" outlined dense label="Cota" :options="['Master', 'Ouro', 'Parceiro', 'Midia']" />
        </FormPanel>

        <FormPanel title="Noticia personalizada" icon="article" submit-label="Salvar noticia" @submit="submit('/api/news', newsForm, resetNews)">
          <q-input v-model="newsForm.title" outlined dense label="Titulo" />
          <q-input v-model="newsForm.tag" outlined dense label="Categoria da noticia" />
        </FormPanel>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useLeagueStore } from '../stores/league';

const props = defineProps({
  section: {
    type: String,
    default: 'competitions'
  }
});

const FormPanel = defineComponent({
  props: {
    title: { type: String, required: true },
    icon: { type: String, required: true },
    submitLabel: { type: String, default: 'Salvar' }
  },
  emits: ['submit'],
  setup(formProps, { emit, slots }) {
    return () =>
      h('div', { class: 'panel form-panel p-4' }, [
        h('div', { class: 'mb-4 flex items-center gap-2' }, [
          h('i', { class: 'material-icons text-league-red' }, formProps.icon),
          h('h2', { class: 'section-title m-0' }, formProps.title)
        ]),
        h(
          'form',
          {
            class: 'grid gap-3',
            onSubmit: (event) => {
              event.preventDefault();
              emit('submit');
            }
          },
          [
            ...(slots.default?.() || []),
            h(
              'button',
              {
                class: 'inline-flex min-h-10 items-center justify-center rounded bg-league-navy px-4 py-2 text-sm font-bold text-white',
                type: 'submit'
              },
              formProps.submitLabel
            )
          ]
        )
      ]);
  }
});

const DataPanel = defineComponent({
  props: {
    title: { type: String, required: true }
  },
  setup(panelProps, { slots }) {
    return () =>
      h('div', { class: 'panel data-panel overflow-hidden p-4' }, [
        h('h2', { class: 'section-title mb-4' }, panelProps.title),
        h('div', { class: 'table-scroll' }, slots.default?.())
      ]);
  }
});

const $q = useQuasar();
const route = useRoute();
const store = useLeagueStore();

const section = computed(() => props.section);
const sectionInfo = computed(() => sectionConfig[props.section] || sectionConfig.competitions);

const tablePagination = { rowsPerPage: 8 };
const statusOptions = ['Planejamento', 'Inscricoes abertas', 'Em andamento', 'Finalizado'];
const documentTypeOptions = ['Ficha de inscricao', 'Documento de identidade', 'Comprovante', 'Autorizacao', 'Outro documento'];
const summaryTypeOptions = ['Sumula pre-jogo', 'Sumula pos-jogo'];
const documentStatusOptions = ['Recebido', 'Em analise', 'Aprovado', 'Pendente'];
const staffRoleOptions = ['Treinador', 'Auxiliar Tecnico', 'Preparador Fisico', 'Massagista', 'Medico'];
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';

const sectionConfig = {
  competitions: { icon: 'emoji_events', kicker: 'Gestao esportiva', title: 'Campeonatos e categorias' },
  teams: { icon: 'groups', kicker: 'Cadastros', title: 'Times e atletas' },
  matches: { icon: 'scoreboard', kicker: 'Calendario', title: 'Jogos e rodadas' },
  summaries: { icon: 'description', kicker: 'Jogo', title: 'Sumulas' },
  documents: { icon: 'folder', kicker: 'Anexos', title: 'Documentos' },
  registrations: { icon: 'how_to_reg', kicker: 'Operacao', title: 'Inscricoes' },
  structure: { icon: 'stadium', kicker: 'Organizacao', title: 'Estrutura da liga' },
  media: { icon: 'campaign', kicker: 'Comunicacao', title: 'Midia e portal' }
};

const championshipForm = reactive({ name: '', category: '', status: 'Planejamento', teamsLimit: 16 });
const categoryForm = reactive({ name: '', gender: 'Masculino', ageLimit: 'Livre' });
const teamForm = reactive({ name: '', city: '', coach: '', athletes: 0 });
const athleteForm = reactive({ name: '', team: '', document: '', jerseyNumber: '', position: 'Linha', registrationStatus: 'Apto' });
const staffForm = reactive({ team: '', name: '', role: 'Treinador', document: '' });
const matchForm = reactive({ championship: '', round: '', homeTeam: '', awayTeam: '', venue: '', date: '', time: '20:00', status: 'Agendado' });
const generatedRoundForm = reactive({ round: 'Rodada gerada', date: '', venue: '' });
const scoreForm = reactive({ matchId: null, homeGoals: 0, awayGoals: 0, homeScorer: '', awayScorer: '' });
const summaryForm = reactive({ matchId: null, documentType: 'Sumula pre-jogo', status: 'Recebido', fileUrl: '' });
const documentForm = reactive({ ownerType: 'Equipe', ownerName: '', documentType: 'Ficha de inscricao', status: 'Recebido', fileUrl: '' });
const registrationForm = reactive({ teamName: '', responsible: '', category: '' });
const registrationStatusForm = reactive({ id: null, status: 'Aprovada' });
const refereeForm = reactive({ name: '', city: '', phone: '' });
const venueForm = reactive({ name: '', city: '', address: '', capacity: 0 });
const suspensionForm = reactive({ athlete: '', team: '', reason: '', matchesLeft: 1 });
const broadcastForm = reactive({ matchId: null, platform: 'YouTube', url: '' });
const selectionForm = reactive({ round: '', athlete: '', team: '', note: '' });
const sponsorForm = reactive({ name: '', tier: 'Parceiro' });
const newsForm = reactive({ title: '', tag: 'Competicao' });

const categoryOptions = computed(() => store.categories.map((item) => item.name));
const championshipOptions = computed(() => store.championships.map((item) => item.name));
const teamOptions = computed(() => store.teams.map((item) => item.name));
const venueOptions = computed(() => store.venues.map((item) => item.name));
const athleteOptions = computed(() => store.athletes.map((item) => item.name));
const matchOptions = computed(() =>
  store.matches.map((item) => ({
    label: formatMatchLabel(item),
    value: item.id
  }))
);
const registrationOptions = computed(() =>
  store.registrations.map((item) => ({
    label: `${item.teamName} - ${item.status}`,
    value: item.id
  }))
);
const documentOwnerOptions = computed(() => (documentForm.ownerType === 'Atleta' ? athleteOptions.value : teamOptions.value));
const summaryDocuments = computed(() =>
  store.documents.filter((item) => item.ownerType === 'Jogo' || item.documentType.toLowerCase().includes('sumula'))
);
const regularDocuments = computed(() =>
  store.documents.filter((item) => item.ownerType !== 'Jogo' && !item.documentType.toLowerCase().includes('sumula'))
);

const championshipColumns = [
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  { name: 'category', label: 'Categoria', field: 'category', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
  { name: 'teamsLimit', label: 'Limite', field: 'teamsLimit', align: 'left' }
];
const categoryColumns = [
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  { name: 'gender', label: 'Genero', field: 'gender', align: 'left' },
  { name: 'ageLimit', label: 'Idade', field: 'ageLimit', align: 'left' }
];
const teamColumns = [
  { name: 'name', label: 'Time', field: 'name', align: 'left' },
  { name: 'city', label: 'Cidade', field: 'city', align: 'left' },
  { name: 'coach', label: 'Treinador', field: 'coach', align: 'left' },
  { name: 'athletes', label: 'Atletas', field: 'athletes', align: 'left' }
];
const athleteColumns = [
  { name: 'name', label: 'Atleta', field: 'name', align: 'left' },
  { name: 'team', label: 'Time', field: 'team', align: 'left' },
  { name: 'document', label: 'Documento', field: 'document', align: 'left' },
  { name: 'jerseyNumber', label: 'No', field: 'jerseyNumber', align: 'left' },
  { name: 'position', label: 'Funcao', field: 'position', align: 'left' },
  { name: 'registrationStatus', label: 'Condicao', field: 'registrationStatus', align: 'left' }
];
const staffColumns = [
  { name: 'team', label: 'Time', field: 'team', align: 'left' },
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  { name: 'role', label: 'Cargo', field: 'role', align: 'left' },
  { name: 'document', label: 'Documento', field: 'document', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' }
];
const panelColumns = [
  { name: 'teamName', label: 'Time', field: 'teamName', align: 'left' },
  { name: 'login', label: 'Login', field: 'login', align: 'left' },
  { name: 'temporaryPassword', label: 'Senha temporaria', field: 'temporaryPassword', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' }
];
const matchColumns = [
  { name: 'championship', label: 'Campeonato', field: 'championship', align: 'left' },
  { name: 'round', label: 'Rodada', field: 'round', align: 'left' },
  { name: 'homeTeam', label: 'Mandante', field: 'homeTeam', align: 'left' },
  { name: 'score', label: 'Placar', field: 'score', align: 'left' },
  { name: 'awayTeam', label: 'Visitante', field: 'awayTeam', align: 'left' },
  { name: 'date', label: 'Data', field: 'date', align: 'left' },
  { name: 'time', label: 'Hora', field: 'time', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' }
];
const summaryMatchColumns = [
  { name: 'round', label: 'Rodada', field: 'round', align: 'left' },
  { name: 'homeTeam', label: 'Mandante', field: 'homeTeam', align: 'left' },
  { name: 'awayTeam', label: 'Visitante', field: 'awayTeam', align: 'left' },
  { name: 'date', label: 'Data', field: 'date', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' }
];
const documentColumns = [
  { name: 'ownerType', label: 'Vinculo', field: 'ownerType', align: 'left' },
  { name: 'ownerName', label: 'Nome', field: 'ownerName', align: 'left' },
  { name: 'documentType', label: 'Tipo', field: 'documentType', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' }
];
const registrationColumns = [
  { name: 'teamName', label: 'Time', field: 'teamName', align: 'left' },
  { name: 'responsible', label: 'Responsavel', field: 'responsible', align: 'left' },
  { name: 'category', label: 'Categoria', field: 'category', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' }
];
const refereeColumns = [
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  { name: 'city', label: 'Cidade', field: 'city', align: 'left' },
  { name: 'phone', label: 'Telefone', field: 'phone', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' }
];
const venueColumns = [
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  { name: 'city', label: 'Cidade', field: 'city', align: 'left' },
  { name: 'address', label: 'Endereco', field: 'address', align: 'left' },
  { name: 'capacity', label: 'Capacidade', field: 'capacity', align: 'left' }
];
const suspensionColumns = [
  { name: 'athlete', label: 'Atleta', field: 'athlete', align: 'left' },
  { name: 'team', label: 'Time', field: 'team', align: 'left' },
  { name: 'reason', label: 'Motivo', field: 'reason', align: 'left' },
  { name: 'matchesLeft', label: 'Jogos', field: 'matchesLeft', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' }
];

function formatMatchLabel(match) {
  return `${match.round}: ${match.homeTeam} x ${match.awayTeam}`;
}

async function submit(path, form, reset) {
  try {
    await store.create(path, { ...form });
    reset();
    $q.notify({ type: 'positive', message: 'Registro salvo.' });
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message });
  }
}

async function submitSummary() {
  const match = store.matches.find((item) => item.id === summaryForm.matchId);
  if (!match) {
    $q.notify({ type: 'negative', message: 'Selecione um jogo.' });
    return;
  }

  await submit('/api/documents', {
    ownerType: 'Jogo',
    ownerName: formatMatchLabel(match),
    documentType: summaryForm.documentType,
    status: summaryForm.status,
    fileUrl: summaryForm.fileUrl
  }, resetSummary);
}

async function patch(path, form, reset) {
  try {
    await store.patch(path, { ...form });
    reset();
    $q.notify({ type: 'positive', message: 'Registro atualizado.' });
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message });
  }
}

function selectMatchForSummary(match) {
  summaryForm.matchId = match.id;
}

function openSheetPdf(matchId) {
  window.open(`${apiUrl}/api/matches/${matchId}/sheet.pdf`, '_blank', 'noopener,noreferrer');
}

function applyRouteMatch() {
  const matchId = Number(route.query.matchId);
  if (Number.isInteger(matchId) && matchId > 0) {
    summaryForm.matchId = matchId;
  }
}

function applyDefaultChampionship() {
  if (!matchForm.championship && championshipOptions.value.length > 0) {
    matchForm.championship = championshipOptions.value[0];
  }
}

function resetChampionship() {
  Object.assign(championshipForm, { name: '', category: '', status: 'Planejamento', teamsLimit: 16 });
}
function resetCategory() {
  Object.assign(categoryForm, { name: '', gender: 'Masculino', ageLimit: 'Livre' });
}
function resetTeam() {
  Object.assign(teamForm, { name: '', city: '', coach: '', athletes: 0 });
}
function resetAthlete() {
  Object.assign(athleteForm, { name: '', team: '', document: '', jerseyNumber: '', position: 'Linha', registrationStatus: 'Apto' });
}
function resetStaff() {
  Object.assign(staffForm, { team: '', name: '', role: 'Treinador', document: '' });
}
function resetMatch() {
  Object.assign(matchForm, { championship: championshipOptions.value[0] || '', round: '', homeTeam: '', awayTeam: '', venue: '', date: '', time: '20:00', status: 'Agendado' });
}
function resetGeneratedRound() {
  Object.assign(generatedRoundForm, { round: 'Rodada gerada', date: '', venue: '' });
}
function resetScore() {
  Object.assign(scoreForm, { matchId: null, homeGoals: 0, awayGoals: 0, homeScorer: '', awayScorer: '' });
}
function resetSummary() {
  Object.assign(summaryForm, { matchId: null, documentType: 'Sumula pre-jogo', status: 'Recebido', fileUrl: '' });
}
function resetDocument() {
  Object.assign(documentForm, { ownerType: 'Equipe', ownerName: '', documentType: 'Ficha de inscricao', status: 'Recebido', fileUrl: '' });
}
function resetRegistration() {
  Object.assign(registrationForm, { teamName: '', responsible: '', category: '' });
}
function resetRegistrationStatus() {
  Object.assign(registrationStatusForm, { id: null, status: 'Aprovada' });
}
function resetReferee() {
  Object.assign(refereeForm, { name: '', city: '', phone: '' });
}
function resetVenue() {
  Object.assign(venueForm, { name: '', city: '', address: '', capacity: 0 });
}
function resetSuspension() {
  Object.assign(suspensionForm, { athlete: '', team: '', reason: '', matchesLeft: 1 });
}
function resetBroadcast() {
  Object.assign(broadcastForm, { matchId: null, platform: 'YouTube', url: '' });
}
function resetSelection() {
  Object.assign(selectionForm, { round: '', athlete: '', team: '', note: '' });
}
function resetSponsor() {
  Object.assign(sponsorForm, { name: '', tier: 'Parceiro' });
}
function resetNews() {
  Object.assign(newsForm, { title: '', tag: 'Competicao' });
}

watch(
  () => route.query.matchId,
  () => {
    applyRouteMatch();
  }
);

watch(
  () => documentForm.ownerType,
  () => {
    documentForm.ownerName = '';
  }
);

watch(
  () => store.championships,
  () => {
    applyDefaultChampionship();
  }
);

onMounted(async () => {
  await store.load();
  applyDefaultChampionship();
  applyRouteMatch();
});
</script>
