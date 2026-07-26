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
- Painel seguro por conta individual e perfil de acesso.
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

## Autenticacao e perfis

O sistema possui sessao revogavel e quatro perfis:

- `user`: portal publico e conta pessoal.
- `representative`: atletas, comissao, documentos e inscricoes apenas da propria equipe.
- `staff`: operacao esportiva e administrativa da LSRDF.
- `admin`: tudo do perfil `staff` mais gestao de usuarios e permissoes em `/usuarios`.

Crie os arquivos `.env` a partir dos exemplos. No primeiro start da API, defina
`BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`. A conta e criada com senha
protegida por scrypt; remova essas variaveis logo depois.

Para login Google, crie um OAuth Client ID do tipo Web no Google Cloud, cadastre
as origens autorizadas e use o mesmo valor em `GOOGLE_CLIENT_ID` (API) e
`VITE_GOOGLE_CLIENT_ID` (web). Sem essas variaveis, o login por e-mail continua
funcionando e o botao Google nao aparece.

Use Node.js 20 ou 22 LTS. A dependencia nativa SQLite deste projeto nao e
compativel com Node 24 sem um ambiente de compilacao C++.

## LGPD e preparacao comercial

Foram adicionados controle de acesso no backend, isolamento de representantes por
equipe, senhas com hash, limitacao de login, sessoes revogaveis, trilha de
auditoria, cabecalhos de seguranca, aceite versionado de privacidade e paginas de
Politica de Privacidade e Termos.

Antes de vender/publicar, a LSRDF ainda deve:

- nomear e divulgar o canal do encarregado ou responsavel por privacidade;
- validar com assessoria juridica as bases legais e os textos conforme os fluxos reais;
- definir tabela de retencao e descarte para documentos, atletas e logs;
- contratar hospedagem com HTTPS, backups criptografados e controle de acesso;
- formalizar contratos com operadores (hosting, e-mail, Google e armazenamento);
- criar processo para direitos dos titulares e resposta a incidentes;
- substituir URLs de documentos por upload privado com autorizacao e expiração.

Conformidade com a LGPD nao e obtida apenas por codigo; ela tambem depende de
processos, contratos, governanca e operacao da organizacao.

## Proximos passos naturais

- CRUD completo com formularios de edicao.
- Upload privado de documentos e sumulas.
- Regras configuraveis de suspensao.
- Publicacao de sites por campeonato.
