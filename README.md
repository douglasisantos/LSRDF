# LSRDF Platform

Sistema para a Liga Sul Riograndense de Futsal, inspirado nas funcionalidades de plataformas de gestao de campeonatos: criacao de competicoes, times, atletas, jogos, inscricoes, sumulas, estatisticas, patrocinadores, noticias e portal publico.

## Stack

- Frontend: Vue 3, Quasar, Tailwind CSS, SCSS e Vite.
- Backend: Node.js, Fastify e SQLite.
- Banco: arquivo local `apps/api/data/lsrdf.sqlite`.

## Como rodar

```bash
npm install
npm run dev:api
npm run dev:web
```

URLs padrao:

- API: `http://localhost:3333`
- Web: `http://localhost:9000`

Em desenvolvimento, deixe os dois comandos rodando em terminais separados.
O frontend consome `VITE_API_URL`, com exemplo em `apps/web/.env.example`.
A logo da liga foi copiada para `apps/web/src/assets/logo.png`.

## Funcionalidades implementadas

- Dashboard da liga com indicadores.
- Campeonatos com categorias, status e limite de times, com cadastro pela tela `/gestao`.
- Gestao de categorias.
- Gestao de times, atletas e responsaveis.
- Painel de times com login e senha temporaria.
- Calendario de jogos, placares e status.
- Geracao automatica de rodada usando os times cadastrados.
- Lancamento de placar com atualizacao de gols de atletas.
- Inscricoes online e atualizacao de status da inscricao.
- Cadastro de arbitros.
- Cadastro de campos/ginasios.
- Estatisticas de artilharia, cartoes, ranking e aproveitamento.
- Sumulas e documentos por equipe, atleta ou jogo.
- Suspensoes manuais.
- Links de transmissao ao vivo.
- Selecao da rodada.
- Patrocinadores e parceiros.
- Noticias personalizadas.
- Portal publico com identidade visual baseada na logo da LSRDF.

## Proximos passos naturais

- Autenticacao por perfil: organizador, treinador, atleta e torcedor.
- CRUD completo com formularios de edicao.
- Upload real de documentos e sumulas.
- Regras configuraveis de suspensao.
- Publicacao de sites por campeonato.
