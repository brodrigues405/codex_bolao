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
