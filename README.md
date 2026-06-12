# Bolao Copa 2026

MVP de bolao corporativo com foco em simplicidade operacional, custo baixo e deploy em nuvem free.

## Stack

- `Next.js`
- `TypeScript`
- `Docker Compose`
- `Postgres`
- `Vercel Hobby` opcional para publicacao
- `Supabase Auth + Postgres` opcional para nuvem free

## O que ja esta nesta base

- layout inicial com visual simples e moderno
- paginas de `login`, `dashboard`, `palpites`, `ranking` e `admin`
- regras de pontuacao `5/2/0`
- autenticacao local simples via cookie para ambiente Docker
- leitura real do `Postgres` local para home, dashboard, ranking, admin e palpites
- schema inicial do Supabase em [supabase/schema.sql](/c:/Users/Enterprise/Desktop/codex_bolao/supabase/schema.sql)
- seed inicial do Supabase em [supabase/seed.sql](/c:/Users/Enterprise/Desktop/codex_bolao/supabase/seed.sql)
- ambiente Docker local com app + Postgres em [docker-compose.yml](/c:/Users/Enterprise/Desktop/codex_bolao/docker-compose.yml)
- schema local do banco em [docker/postgres/init/001_schema.sql](/c:/Users/Enterprise/Desktop/codex_bolao/docker/postgres/init/001_schema.sql)
- seed local com usuarios de desenvolvimento em [docker/postgres/init/002_seed.sql](/c:/Users/Enterprise/Desktop/codex_bolao/docker/postgres/init/002_seed.sql)
- carga oficial de grupos, selecoes e jogos em [docker/postgres/init/003_official_seed.sql](/c:/Users/Enterprise/Desktop/codex_bolao/docker/postgres/init/003_official_seed.sql)
- fonte unica de verdade da Copa em [seed/groups.json](/c:/Users/Enterprise/Desktop/codex_bolao/seed/groups.json), [seed/teams.json](/c:/Users/Enterprise/Desktop/codex_bolao/seed/teams.json) e [seed/matches.json](/c:/Users/Enterprise/Desktop/codex_bolao/seed/matches.json)

## Estrutura recomendada

- `Docker local`: desenvolvimento, continuidade entre maquinas, versionamento da infraestrutura
- `Postgres local em container`: persistencia local e previsivel
- `Supabase`: opcional se voce quiser autenticacao e hospedagem de banco em nuvem free
- `Vercel`: opcional se voce quiser publicar o frontend depois

## Como rodar com Docker

1. Copie `.env.docker.example` para `.env.docker`
2. Rode `docker compose up --build`
3. Abra `http://localhost:3000`
4. O banco Postgres ficara disponivel em `localhost:5432`
5. Entre com `admin/admin123`

Se voce alterar os scripts em `docker/postgres/init`, recrie o volume do banco para reaplicar o seed:

```bash
docker compose down -v
docker compose up --build
```

## O que sobe no Docker

- `app`: container do Next.js em modo de desenvolvimento
- `db`: container Postgres com criacao automatica de schema e seed inicial

## Arquivos de infraestrutura Docker

- [Dockerfile](/c:/Users/Enterprise/Desktop/codex_bolao/Dockerfile)
- [docker-compose.yml](/c:/Users/Enterprise/Desktop/codex_bolao/docker-compose.yml)
- [.env.docker.example](/c:/Users/Enterprise/Desktop/codex_bolao/.env.docker.example)
- [docker/postgres/init/001_schema.sql](/c:/Users/Enterprise/Desktop/codex_bolao/docker/postgres/init/001_schema.sql)
- [docker/postgres/init/002_seed.sql](/c:/Users/Enterprise/Desktop/codex_bolao/docker/postgres/init/002_seed.sql)

## Como seguir em outra maquina

1. Clonar o repositorio
2. Copiar `.env.docker.example` para `.env.docker`
3. Rodar `docker compose up --build`
4. Continuar o desenvolvimento sem depender de Node instalado na maquina host

## Caminho cloud opcional

Se voce quiser publicar depois:

1. manter a base local em Docker para desenvolvimento
2. subir o app na `Vercel`
3. apontar o banco para `Supabase` ou outro Postgres gerenciado free

## Vercel + Supabase

Se o deploy na Vercel mostrar erro parecido com `getaddrinfo ENOTFOUND db`, isso significa que a aplicacao nao recebeu uma `DATABASE_URL` valida e caiu na configuracao local do Docker, cujo host e `db`.

Para publicar com Supabase:

1. Abra `Supabase > Project Settings > Database`
2. Copie a `Connection string` do tipo `URI`
3. Use essa string completa na variavel `DATABASE_URL` da Vercel
4. Garanta que a URL use um host real do Supabase, nunca `db`
5. Se necessario, mantenha `sslmode=require` na string

Exemplo esperado:

```bash
DATABASE_URL=postgresql://postgres.xxxxx:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

Observacoes importantes:

- O host `db` so existe dentro do `docker-compose`
- `.env.docker` serve apenas para ambiente local com Docker
- A Vercel precisa ter sua propria `DATABASE_URL` configurada em `Project Settings > Environment Variables`
- Depois de salvar a variavel, faca um novo deploy

As variaveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` so sao necessarias se voce for usar recursos da API/Auth do Supabase. O acesso atual desta base ao banco usa `pg` com `DATABASE_URL`.

## Carga inicial no Supabase

Para este projeto funcionar na Vercel com Supabase, o banco remoto precisa ter o mesmo schema usado no Docker local.

Arquivos corretos:

- schema: [supabase/schema.sql](/c:/Users/Enterprise/Desktop/codex_bolao/supabase/schema.sql)
- seed do admin: [supabase/seed.sql](/c:/Users/Enterprise/Desktop/codex_bolao/supabase/seed.sql)

Passo a passo:

1. Abra o `SQL Editor` do Supabase
2. Rode primeiro `supabase/schema.sql`
3. Rode depois `supabase/seed.sql`
4. Entre na aplicacao com `admin/admin123`
5. Abra `/admin`
6. Clique em `Sincronizar tabela oficial`

O botao `Sincronizar tabela oficial` carrega os arquivos versionados `seed/groups.json`, `seed/teams.json` e `seed/matches.json` para as tabelas `groups`, `teams` e `matches`.

Se o banco remoto tiver sido criado com uma versao antiga do schema, a aplicacao pode autenticar o admin e ainda assim mostrar `0` jogos, porque o app espera estas estruturas:

- tabela `app_users`, nao `users`
- `teams` com `unique (code, group_id)`
- `matches` com coluna `external_id`
- `app_users` com coluna `must_change_password`

## Sobre o Security Advisor do Supabase

Os alertas de `RLS Disabled in Public` nao causam esse erro de conexao da Vercel. Eles indicam um ponto de seguranca: tabelas do schema `public` expostas via APIs do Supabase estao sem Row Level Security.

Resumo pratico:

- Isso nao explica o `ENOTFOUND db`
- Isso pode ser um problema de seguranca se voce acessar essas tabelas pelo client do Supabase no frontend
- Se o app continuar usando apenas conexao server-side com `pg`, o impacto imediato e menor
- Ainda assim, vale habilitar `RLS` antes de expor leitura/escrita dessas tabelas via Supabase Auth/API

## Estrategia de importacao

Fluxo recomendado para o admin:

1. importar `groups.json`
2. importar `teams.json`
3. importar `matches.json`
4. revisar horarios e status no painel admin
5. durante a Copa, atualizar placares oficiais manualmente

O painel admin tambem tem a acao `Sincronizar tabela oficial`, que reaplica os arquivos versionados e remove jogos antigos que nao pertencam a tabela da Copa.

## Como importar a tabela da Copa

1. Baixe ou confira a tabela oficial na pagina da FIFA:
   `https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums`
2. Use [seed/teams.json](/c:/Users/Enterprise/Desktop/codex_bolao/seed/teams.json) como fonte de verdade das `48 selecoes`
3. Use [seed/matches.json](/c:/Users/Enterprise/Desktop/codex_bolao/seed/matches.json) como fonte de verdade dos jogos
4. Suba os containers:
   `docker compose up -d`
5. Rode a importacao:
   `docker compose exec app npm run import:official`

Detalhes do formato dos arquivos estao em [seed/README.md](/c:/Users/Enterprise/Desktop/codex_bolao/seed/README.md).

## O que falta para fechar o produto

- salvar e editar palpites direto no banco pela interface
- adicionar cadastro real de participantes pelo admin
- endurecer a seguranca da sessao local
- preparar a troca de autenticacao local para Supabase no momento do deploy

## Regras do bolao

- `5 pontos` para placar exato
- `2 pontos` para acertar vencedor ou empate
- `0 ponto` para erro total
- palpite travado no horario do jogo
- recomendacao de `1 usuario admin` e `usuarios individuais` para participantes
