<template>
  <q-page class="legal-page">
    <article class="panel legal-card">
      <q-btn flat no-caps icon="arrow_back" label="Voltar" @click="$router.back()" />
      <p class="auth-kicker">LSRDF • Transparência</p>
      <h1>{{ isTerms ? 'Termos de Uso' : 'Política de Privacidade' }}</h1>
      <p class="legal-updated">Versão de 25 de julho de 2026.</p>

      <template v-if="isTerms">
        <h2>Uso da plataforma</h2>
        <p>A plataforma apoia a gestão de competições da LSRDF. Cada pessoa deve usar sua própria conta, manter suas credenciais seguras e informar dados verdadeiros.</p>
        <h2>Perfis e responsabilidades</h2>
        <p>O acesso depende do perfil aprovado pela Liga. Representantes somente podem operar dados da equipe à qual estão vinculados. A LSRDF pode bloquear acessos em caso de risco ou uso indevido.</p>
        <h2>Conteúdo esportivo</h2>
        <p>Resultados, tabelas e comunicados podem ser publicados no portal. Dados pessoais e documentos administrativos permanecem em áreas restritas.</p>
      </template>
      <template v-else>
        <h2>Controlador e finalidade</h2>
        <p>A LSRDF é responsável pelas decisões sobre o tratamento. Usamos dados para autenticar pessoas, receber inscrições, validar atletas e equipes, organizar jogos, cumprir obrigações e proteger a plataforma.</p>
        <h2>Dados tratados</h2>
        <p>Podemos tratar identificação, contato, vínculo com equipe, documentos esportivos, registros de acesso e dados necessários à competição. Coletamos somente o necessário para cada finalidade.</p>
        <h2>Bases legais, compartilhamento e retenção</h2>
        <p>O tratamento pode se apoiar na execução de contrato, obrigação legal ou regulatória, legítimo interesse e consentimento quando aplicável. Dados são compartilhados apenas com fornecedores essenciais ou autoridades quando exigido. Os prazos de retenção devem seguir a finalidade e as obrigações legais da Liga.</p>
        <h2>Seus direitos</h2>
        <p>Você pode solicitar confirmação, acesso, correção, informação sobre compartilhamento, portabilidade quando aplicável, revisão e eliminação de dados tratados por consentimento, observadas as hipóteses legais de conservação.</p>
        <h2>Canal de privacidade</h2>
        <p>Antes da publicação comercial, a LSRDF deve informar aqui o nome do encarregado e um e-mail oficial para solicitações relacionadas à LGPD.</p>
      </template>
    </article>
  </q-page>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const isTerms = computed(() => route.name === 'terms');
</script>
