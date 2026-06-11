# Seeds da Copa

Estes arquivos sao a fonte de verdade versionada do torneio no projeto.

## Fonte recomendada

- FIFA: `Match schedule, fixtures, results, teams and stadiums`
- URL:
  `https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums`

## Arquivos

- `groups.json`
- `teams.json`
- `matches.json`

## Formato de `teams.json`

```json
[
  {
    "id": "t1",
    "code": "BRA",
    "name": "Brazil",
    "group": "C",
    "isSample": false
  }
]
```

Campos opcionais:

- `flagUrl`

## Formato de `matches.json`

```json
[
  {
    "externalId": "wc2026-001",
    "fifaMatchNumber": 1,
    "stage": "group",
    "stageLabel": "Grupo A",
    "groupName": "A",
    "homeTeamCode": "MEX",
    "awayTeamCode": "RSA",
    "kickoffAtUtc": "2026-06-11T23:00:00Z",
    "stadium": "Estadio Azteca",
    "city": "Mexico City",
    "country": "Mexico",
    "status": "scheduled"
  }
]
```

Campos opcionais:

- `fifaMatchNumber`
- `groupName`
- `stadium`
- `city`
- `country`
- `status`
- `homeScore`
- `awayScore`
- `homeSlotLabel`
- `awaySlotLabel`
- `needsKickoffReview`

## Importacao

Com os containers no ar:

```bash
docker compose exec app npm run import:official
```

## Observacao

O arquivo `matches.json` contem os `104 jogos` da Copa:

- `72 jogos` de fase de grupos
- `32 jogos` de mata-mata com vagas a definir em `homeSlotLabel` e `awaySlotLabel`

Ainda falta revisar os horarios UTC dos registros marcados com `needsKickoffReview: true`.
