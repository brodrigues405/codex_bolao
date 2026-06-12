# Architecture

## Visao geral

O projeto e uma aplicacao de bolao da Copa 2026 construida em `Next.js` com renderizacao server-side, banco `Postgres` e dois modos principais de execucao:

- `Docker local` para desenvolvimento
- `Vercel + Supabase/Postgres` para producao

A aplicacao concentra:

- autenticacao propria via `app_users`
- gestao de grupos, selecoes e jogos
- palpites por participante
- ranking calculado a partir de palpites e resultados oficiais
- operacao administrativa para carga inicial e sincronizacao de resultados

## Diagrama de alto nivel

```text
┌─────────────────────────────────────────────────────────────────────┐
│                              Usuarios                              │
│                    Admins e Participantes                          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Next.js App                              │
│                                                                     │
│  Rotas UI:                                                           │
│  /  /login  /primeiro-acesso  /palpites  /ranking  /admin           │
│                                                                     │
│  Componentes principais:                                             │
│  - MainNav                                                           │
│  - HomeHubTabs                                                       │
│  - HomeAgendaTabs                                                    │
│  - PredictionTabs                                                    │
│  - PredictionForm                                                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Server Actions e Libs                          │
│                                                                     │
│  app/actions.ts                                                      │
│  - login/logout                                                      │
│  - troca de senha                                                    │
│  - criar participante                                                │
│  - salvar palpite                                                    │
│  - sincronizar tabela oficial                                        │
│  - buscar resultados oficiais                                        │
│                                                                     │
│  lib/auth.ts                                                         │
│  - autenticacao por cookie                                           │
│  - controle de admin/participant                                     │
│                                                                     │
│  lib/data.ts                                                         │
│  - consultas                                                         │
│  - normalizacao de jogos                                             │
│  - agenda                                                            │
│  - ranking                                                           │
│                                                                     │
│  lib/scoring.ts                                                      │
│  - regra 5/2/0                                                       │
│                                                                     │
│  lib/official-seeds.ts                                               │
│  - upsert de grupos, selecoes e jogos                                │
│                                                                     │
│  lib/official-results.ts                                             │
│  - sincronizacao de resultados externos                              │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Postgres DB                              │
│                                                                     │
│  Tabelas principais:                                                 │
│  - groups                                                            │
│  - teams                                                             │
│  - matches                                                           │
│  - app_users                                                         │
│  - predictions                                                       │
│  - bonus_predictions                                                 │
│  - audit_logs                                                        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ├─────────────────────────────────────┐
                                │                                     │
                                ▼                                     ▼
                  ┌───────────────────────────┐      ┌─────────────────────────┐
                  │ Seeds versionados         │      │ API externa de jogos    │
                  │ seed/groups.json          │      │ https://worldcup26.ir   │
                  │ seed/teams.json           │      │ /get/games              │
                  │ seed/matches.json         │      └─────────────────────────┘
                  └───────────────────────────┘
```

## Camadas da solucao

### 1. Camada web

Framework principal:

- `Next.js 15`
- `App Router`

Paginas principais:

- `/` home consolidada
- `/palpites`
- `/ranking`
- `/admin`
- `/login`
- `/primeiro-acesso`

Observacoes:

- `/dashboard` foi mantida apenas como rota de compatibilidade e redireciona para `/`
- a home e o hub principal da experiencia

## 2. Home como hub principal

A home foi consolidada em duas visoes:

- `Dados do bolao`
- `Dados do participante`

### Dados do bolao

Mostra:

- ranking resumido
- agenda segmentada em:
  - proximos jogos
  - jogos bloqueados
  - jogos finalizados

### Dados do participante

Mostra:

- meus pontos
- minha posicao
- placares exatos
- palpites feitos
- situacao no ranking
- acoes rapidas para palpites e ranking

## 3. Autenticacao

Implementada em [lib/auth.ts](./lib/auth.ts).

Modelo:

- autenticacao propria via `app_users`
- sessao em cookie `bolao_session`
- login por `username + password_hash`
- suporte a `must_change_password`

Perfis:

- `admin`
- `participant`

## 4. Banco de dados

Conexao em [lib/db.ts](./lib/db.ts).

### Tabelas principais

- `groups`
- `teams`
- `matches`
- `app_users`
- `predictions`
- `bonus_predictions`
- `audit_logs`

### Relacionamentos principais

```text
groups
  └── teams.group_id -> groups.id

teams
  ├── matches.home_team_id -> teams.id
  └── matches.away_team_id -> teams.id

app_users
  ├── predictions.user_id -> app_users.id
  ├── bonus_predictions.user_id -> app_users.id
  └── audit_logs.actor_user_id -> app_users.id

matches
  └── predictions.match_id -> matches.id
```

## 5. Regra de negocio

### Palpites

Cada participante pode registrar um palpite por jogo.

Os palpites ficam em:

- `predictions.predicted_home_score`
- `predictions.predicted_away_score`

### Resultado oficial

O resultado oficial do jogo fica em:

- `matches.home_score`
- `matches.away_score`

Quando esses campos existem, o app trata o jogo como finalizado.

### Pontuacao

Implementada em [lib/scoring.ts](./lib/scoring.ts).

Regra:

- `5 pontos` para placar exato
- `2 pontos` para acertar vencedor ou empate
- `0 ponto` para erro total

## 6. Ranking

O ranking e calculado dinamicamente em [lib/data.ts](./lib/data.ts), principalmente em `getLeaderboard()`.

Fluxo:

1. carregar usuarios
2. carregar jogos
3. carregar palpites
4. cruzar cada palpite com o resultado oficial do jogo
5. aplicar `scorePrediction()`
6. somar:
   - pontos
   - exatos
   - acertos de resultado
7. ordenar por:
   - `points`
   - `exactHits`
   - `resultHits`

Importante:

- o ranking nao depende de `predictions.points_awarded`
- ele e recalculado dinamicamente com base em `matches` + `predictions`

## 7. Status de jogo

O app trabalha com tres estados visuais:

- `open`
- `locked`
- `finished`

Origem:

- `finished` quando ha resultado oficial ou status final no banco
- `locked` quando o jogo ja passou do horario ou esta em andamento
- `open` quando ainda aceita palpites

Esses estados alimentam:

- agenda da home
- tela de palpites
- exibicao de resultados oficiais

## 8. Seeds oficiais

Fonte versionada do torneio:

- [seed/groups.json](./seed/groups.json)
- [seed/teams.json](./seed/teams.json)
- [seed/matches.json](./seed/matches.json)

Sincronizacao implementada em [lib/official-seeds.ts](./lib/official-seeds.ts).

O painel admin executa:

- `Sincronizar tabela oficial`

Efeito:

- upsert de grupos
- upsert de selecoes
- upsert de jogos
- remocao de jogos antigos fora da base oficial versionada

## 9. Resultados oficiais externos

Integracao implementada em [lib/official-results.ts](./lib/official-results.ts).

Fonte atual:

- `https://worldcup26.ir/get/games`

Documentacao consultada:

- `https://worldcup26.ir/api-docs/`

Campos relevantes usados:

- `id`
- `home_score`
- `away_score`
- `finished`
- `time_elapsed`

Mapeamento atual:

- `game.id` -> `matches.fifa_match_number`
- `finished/time_elapsed` -> `matches.status`
- `home_score/away_score` -> `matches.home_score/away_score`

No admin existe o botao:

- `Buscar resultados oficiais`

## 10. Painel admin

Pagina principal:

- [app/admin/page.tsx](./app/admin/page.tsx)

Responsabilidades:

- sincronizar tabela oficial
- buscar resultados oficiais
- criar participantes
- ativar/desativar participantes
- acompanhar metricas gerais

## 11. Experiencia do participante

Pagina principal:

- [app/palpites/page.tsx](./app/palpites/page.tsx)

Funcionalidades:

- abas por status:
  - jogos disponiveis
  - jogos bloqueados
  - jogos finalizados
- filtro por grupo ou mata-mata
- formulario de palpite com validacao
- exibicao de palpites dos colegas por jogo
- destaque quando o palpite do usuario coincide com o de outros participantes
- exibicao de `Resultado oficial` nos jogos finalizados

## 12. Server Actions

Centralizadas em [app/actions.ts](./app/actions.ts).

Principais acoes:

- `loginAction`
- `logoutAction`
- `changeOwnPasswordAction`
- `createParticipantAction`
- `toggleUserStatusAction`
- `deleteUserAction`
- `savePredictionAction`
- `syncOfficialSeedsAction`
- `syncOfficialResultsAction`

## 13. Ambientes

### Docker local

Usado para desenvolvimento.

Arquivos principais:

- [docker-compose.yml](./docker-compose.yml)
- [.env.docker](./.env.docker)

Caracteristicas:

- host local do banco: `db`
- banco previsivel e reproduzivel
- bom para iteracao e validacao local

### Producao

Hospedagem sugerida:

- frontend/app na `Vercel`
- banco via `Supabase/Postgres`

Configuracao principal:

- `DATABASE_URL` obrigatoria em producao

## 14. Decisoes arquiteturais importantes

### Home consolidada

Motivacao:

- reduzir duplicacao entre home e dashboard
- centralizar descoberta e uso do produto
- deixar a navegacao mais simples

### Ranking dinamico

Motivacao:

- evitar inconsistencias com pontos materializados
- sempre refletir o estado atual dos resultados oficiais

### Seeds versionados

Motivacao:

- manter a tabela oficial sob controle do repositorio
- facilitar reproducao local e em novos ambientes

### Sincronizacao externa manual via admin

Motivacao:

- evitar dependencia automatica silenciosa de API externa
- permitir controle operacional do admin

## 15. Pontos de atencao

- a API de resultados utilizada hoje e terceirizada, nao oficial da FIFA
- o sistema depende da consistencia entre placares oficiais e status dos jogos
- o ranking atual funciona muito bem para escala pequena e media, mas hoje e recalculado em memoria
- se o numero de participantes crescer bastante, pode valer mover parte da apuracao para SQL materializado

## 16. Arquivos-chave

- [app/page.tsx](./app/page.tsx)
- [app/actions.ts](./app/actions.ts)
- [app/admin/page.tsx](./app/admin/page.tsx)
- [app/palpites/page.tsx](./app/palpites/page.tsx)
- [components/home-hub-tabs.tsx](./components/home-hub-tabs.tsx)
- [components/home-agenda-tabs.tsx](./components/home-agenda-tabs.tsx)
- [components/prediction-tabs.tsx](./components/prediction-tabs.tsx)
- [components/prediction-form.tsx](./components/prediction-form.tsx)
- [components/main-nav.tsx](./components/main-nav.tsx)
- [lib/auth.ts](./lib/auth.ts)
- [lib/db.ts](./lib/db.ts)
- [lib/data.ts](./lib/data.ts)
- [lib/scoring.ts](./lib/scoring.ts)
- [lib/official-seeds.ts](./lib/official-seeds.ts)
- [lib/official-results.ts](./lib/official-results.ts)
- [seed/groups.json](./seed/groups.json)
- [seed/teams.json](./seed/teams.json)
- [seed/matches.json](./seed/matches.json)
