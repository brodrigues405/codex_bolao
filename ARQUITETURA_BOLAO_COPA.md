# Arquitetura do Bolao da Copa 2026

## 1. Contexto confirmado da Copa

Baseado nas informacoes publicas consultadas em 10 de junho de 2026:

- A Copa do Mundo de 2026 acontece de `11/06/2026` a `19/07/2026`.
- O torneio tem `48 selecoes` e `104 jogos`.
- O formato tem `12 grupos de 4 selecoes`.
- Avancam para o mata-mata os `2 primeiros de cada grupo` e os `8 melhores terceiros`.
- O mata-mata passa a ter `Round of 32`, `Oitavas`, `Quartas`, `Semifinais`, `3o lugar` e `Final`.
- A abertura sera na Cidade do Mexico e a final em East Rutherford, New Jersey.

Resumo de calendario:

- Fase de grupos: `11/06` a `27/06`
- Round of 32: `28/06` a `03/07`
- Oitavas: `04/07` a `07/07`
- Quartas: `09/07` a `11/07`
- Semifinais: `14/07` e `15/07`
- Disputa de 3o lugar: `18/07`
- Final: `19/07`

## 2. Recomendacao de arquitetura

### Stack mais simples e barata

- `Frontend + backend web`: `Next.js` com `TypeScript`
- `Hospedagem`: `Vercel Hobby`
- `Banco de dados`: `Supabase Postgres`
- `Autenticacao`: `Supabase Auth`
- `Estilo`: `Tailwind CSS`
- `ORM`: `Drizzle` ou `Prisma` (eu escolheria `Drizzle` pela simplicidade)

### Por que essa combinacao

- E uma stack muito simples para subir.
- Tem deploy facil e gratuito para um bolao interno pequeno.
- O banco relacional ajuda muito porque bolao depende de ranking, palpites, jogos, usuarios e travas por horario.
- O Supabase ja resolve autenticacao, banco e backups basicos do projeto hospedado.
- O Vercel e ideal para app web simples com login e paginas administrativas.

### Observacao importante

Se quando voce falou "vertex" quis dizer `Google Vertex AI`, eu nao recomendo usar isso aqui. Para um bolao interno, seria complexidade desnecessaria. A opcao mais simples e barata e `Vercel + Supabase`.

## 3. Principio de operacao do sistema

### O que eu recomendo para o MVP

- Nao depender de API esportiva paga em tempo real.
- Carregar a tabela oficial dos `104 jogos` no banco antes do inicio do torneio.
- O admin atualiza os placares finais dos jogos manualmente.

### Por que isso e melhor

- Elimina custo extra.
- Elimina risco de limite de API gratuita durante a Copa.
- Para bolao interno de empresa, atualizar 2 a 6 jogos por dia durante a competicao e totalmente viavel.
- O sistema fica mais confiavel e previsivel.

## 4. Regras de autenticacao

### O que voce pediu

Voce quer um controle simples com "usuario e senha master" para distribuir.

### Melhor pratica recomendada

Nao recomendo todos usarem o mesmo login. Isso quebra auditoria, ranking individual e controle minimo.

### Solucao simples e segura

- Existe `1 usuario admin master`.
- O admin cadastra os participantes.
- Cada participante recebe:
  - `username`
  - `senha temporaria padrao`
- No primeiro acesso, o usuario troca a senha.

### Se voce quiser algo ainda mais simples

Da para usar:

- `senha padrao unica para primeiro acesso`
- cada usuario entra com `username individual`

Isso preserva o controle de quem apostou, mas reduz o trabalho de distribuicao inicial.

## 5. Telas do sistema

### 1. Login

- Campo `usuario`
- Campo `senha`
- Mensagem simples de erro
- Link de redefinicao apenas para admin, se quiser manter o MVP enxuto

### 2. Dashboard do participante

- Proximos jogos abertos para palpite
- Jogos ja apostados
- Ranking geral
- Pontuacao atual do usuario
- Quantidade de acertos exatos
- Quantidade de acertos de vencedor/empate

### 3. Tela de palpites

- Lista de jogos por data e fase
- Campos para `placar casa` e `placar fora`
- Indicador de `palpite salvo`
- Status:
  - `aberto`
  - `travado`
  - `finalizado`

### 4. Ranking

- Posicao
- Nome do participante
- Pontos totais
- Acertos exatos
- Acertos de resultado
- Ultima atualizacao

### 5. Painel admin

- Cadastro e ativacao/inativacao de usuarios
- Importacao de jogos
- Edicao de horario dos jogos
- Lancamento de placar oficial
- Reprocessamento da pontuacao
- Resumo de participacao

### 6. Resumo de acertos

Essa e a tela que voce pediu para acompanhar de forma resumida:

- total de participantes
- total de palpites enviados
- jogos finalizados
- usuarios que mais pontuaram
- usuarios que ainda nao palpitam em jogos proximos
- top 10 ranking
- acertos exatos por usuario
- acertos por fase

## 6. Regras de pontuacao recomendadas

Minha sugestao para ficar simples e efetivo:

- `5 pontos` para placar exato
- `2 pontos` para acertar apenas vencedor/empate
- `0 ponto` para erro total

### Bonus opcionais

- `10 pontos` para campeao
- `5 pontos` para vice
- `3 pontos` para terceiro colocado

### Regras de desempate

- mais placares exatos
- mais acertos de resultado
- mais pontos no mata-mata
- horario mais antigo do ultimo palpite vencedor

### Regras operacionais importantes

- O palpite trava exatamente no horario do jogo.
- Nao pode editar depois do inicio.
- O horario deve ser salvo em `UTC` no banco.
- Exibir na interface no fuso configurado do usuario ou no fuso padrao do bolao.

## 7. Boas praticas de bolao

### Regras que eu considero obrigatorias

- travar palpite no horario exato da partida
- deixar as regras publicas e fixas antes do primeiro jogo
- mostrar ranking e pontos por jogo de forma transparente
- recalcular a pontuacao de forma deterministica
- guardar historico de alteracao de placar oficial pelo admin
- permitir usuario ver apenas seus palpites antes do inicio do jogo

### O que evitar

- todos compartilharem a mesma conta
- depender de API gratuita em tempo real no meio do torneio
- regra de pontuacao complicada demais
- permitir mudanca de regra no meio da competicao

## 8. Modelo de dados

### Tabelas principais

#### `users`

- `id`
- `auth_user_id`
- `name`
- `username`
- `role` (`admin` ou `participant`)
- `is_active`
- `created_at`

#### `groups`

- `id`
- `name` (`A` ate `L`)

#### `teams`

- `id`
- `name`
- `fifa_code`
- `flag_url`
- `group_id`

#### `matches`

- `id`
- `fifa_match_number`
- `stage`
- `group_name`
- `home_team_id`
- `away_team_id`
- `kickoff_at_utc`
- `stadium`
- `city`
- `country`
- `status` (`scheduled`, `in_progress`, `finished`)
- `home_score`
- `away_score`
- `is_locked`
- `created_at`

#### `predictions`

- `id`
- `user_id`
- `match_id`
- `predicted_home_score`
- `predicted_away_score`
- `points_awarded`
- `created_at`
- `updated_at`

Restricao importante:

- `unique(user_id, match_id)`

#### `bonus_predictions`

- `id`
- `user_id`
- `champion_team_id`
- `runner_up_team_id`
- `third_place_team_id`

#### `leaderboard_snapshots` opcional

- `id`
- `generated_at`
- `user_id`
- `total_points`
- `exact_scores`
- `result_hits`
- `rank_position`

#### `audit_logs`

- `id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `payload_json`
- `created_at`

## 9. Fluxo de negocio

### Antes da Copa

1. Admin sobe a aplicacao.
2. Admin importa selecoes, grupos e tabela dos 104 jogos.
3. Admin cadastra os participantes.
4. Participantes recebem username e senha temporaria.
5. Participantes fazem os palpites.

### Durante a Copa

1. Jogo inicia.
2. Sistema trava automaticamente o palpite.
3. Admin informa o placar oficial ao fim do jogo.
4. Sistema recalcula a pontuacao daquele jogo.
5. Ranking e resumo sao atualizados.

### Depois da Copa

1. Sistema calcula ranking final.
2. Admin exporta resultado em CSV, se quiser.

## 10. Arquitetura tecnica

```text
Usuario
  -> Next.js na Vercel
    -> Rotas protegidas / Server Actions / API Routes
      -> Supabase Auth
      -> Supabase Postgres
```

### Responsabilidades

- `Next.js`
  - login
  - telas
  - regras de acesso
  - processamento de palpites
  - ranking

- `Supabase Auth`
  - sessao
  - usuarios
  - recuperacao de senha

- `Supabase Postgres`
  - tabela de jogos
  - palpites
  - pontuacao
  - auditoria

## 11. Seguranca minima necessaria

- senhas com hash pelo Supabase Auth
- `Row Level Security` nas tabelas sensiveis
- participante so enxerga o que pode ver
- somente admin altera jogos e placares
- todos os horarios salvos em UTC
- auditoria de alteracoes de resultado

### Regras de acesso

- participante pode:
  - ver ranking
  - editar apenas seus palpites antes do horario
  - ver seus dados

- admin pode:
  - gerenciar usuarios
  - gerenciar jogos
  - informar resultados
  - reprocessar ranking

## 12. Estrategia de importacao dos jogos

### Caminho mais simples

- manter um arquivo `JSON` ou `CSV` versionado no projeto com:
  - grupos
  - selecoes
  - jogos
  - datas

### Alternativa

- criar um script de seed que popula o banco uma vez

### Recomendacao

Para esse caso, eu usaria:

- `seed/teams.json`
- `seed/matches.json`

Assim a app nao fica dependente de terceiros para funcionar.

## 13. MVP recomendado

### Entrega 1

- login
- cadastro de participantes pelo admin
- tabela completa da Copa
- tela de palpites
- travamento por horario
- lancamento manual de resultados
- ranking geral
- resumo de acertos

### Entrega 2

- bonus de campeao/vice/terceiro
- exportacao CSV
- painel com filtros por fase
- notificacao de jogos proximos

## 14. Minha recomendacao final

Se a ideia e colocar isso no ar rapido e com custo zero ou quase zero, eu seguiria exatamente assim:

1. `Next.js + TypeScript + Tailwind`
2. `Vercel Hobby`
3. `Supabase Free`
4. `Supabase Auth` com `1 admin master` e `usuarios individuais`
5. `placar oficial atualizado manualmente pelo admin`
6. `regras simples de 5/2/0`

Esse desenho entrega:

- simplicidade
- rastreabilidade
- baixo custo
- baixa manutencao
- experiencia moderna o suficiente para uma equipe interna

## 15. Fontes consultadas

- FIFA World Cup 2026 overview and schedule:
  - https://en.wikipedia.org/wiki/2026_FIFA_World_Cup
- Vercel pricing:
  - https://vercel.com/pricing
- Supabase pricing:
  - https://supabase.com/pricing
- Supabase Auth docs:
  - https://supabase.com/docs/guides/auth
