import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    return databaseUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return "postgresql://bolao:bolao123@db:5432/bolao";
  }

  throw new Error(
    "DATABASE_URL nao definida. Em producao, configure a string de conexao completa do Postgres/Supabase."
  );
}

const databaseUrl = getDatabaseUrl();

const groupsPath = path.join(rootDir, "seed", "groups.json");
const teamsPath = path.join(rootDir, "seed", "teams.json");
const matchesPath = path.join(rootDir, "seed", "matches.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

function normalizeStatus(status) {
  if (!status) return "scheduled";
  if (status === "open") return "scheduled";
  if (status === "locked") return "in_progress";
  if (status === "done") return "finished";
  return status;
}

function validateGroups(groups) {
  assert(Array.isArray(groups), "groups.json precisa ser um array.");

  for (const group of groups) {
    assert(group.id, "Cada grupo precisa ter 'id'.");
    assert(group.name, "Cada grupo precisa ter 'name'.");
  }
}

function validateTeams(teams) {
  assert(Array.isArray(teams), "teams.json precisa ser um array.");

  for (const team of teams) {
    assert(team.code, "Cada selecao precisa ter 'code'.");
    assert(team.name, "Cada selecao precisa ter 'name'.");
    assert(team.group, "Cada selecao precisa ter 'group'.");
  }
}

function validateMatches(matches) {
  assert(Array.isArray(matches), "matches.json precisa ser um array.");

  for (const match of matches) {
    assert(match.externalId, "Cada jogo precisa ter 'externalId'.");
    assert(match.stage, `Jogo ${match.externalId} precisa ter 'stage'.`);
    assert(match.stageLabel, `Jogo ${match.externalId} precisa ter 'stageLabel'.`);
    assert(match.kickoffAtUtc, `Jogo ${match.externalId} precisa ter 'kickoffAtUtc'.`);
    assert(
      match.homeTeamCode || match.homeSlotLabel,
      `Jogo ${match.externalId} precisa ter 'homeTeamCode' ou 'homeSlotLabel'.`
    );
    assert(
      match.awayTeamCode || match.awaySlotLabel,
      `Jogo ${match.externalId} precisa ter 'awayTeamCode' ou 'awaySlotLabel'.`
    );
  }
}

async function upsertGroups(pool, groups) {
  for (const group of groups) {
    await pool.query(
      `
        insert into groups (id, name)
        values ($1, $2)
        on conflict (id) do update set
          name = excluded.name
      `,
      [group.id, group.name]
    );
  }
}

async function upsertTeams(pool, teams) {
  for (const team of teams) {
    await pool.query(
      `
        insert into teams (code, name, group_id, flag_url)
        values ($1, $2, $3, $4)
        on conflict (code, group_id) do update set
          name = excluded.name,
          flag_url = excluded.flag_url
      `,
      [team.code, team.name, team.group, team.flagUrl ?? null]
    );
  }
}

async function resolveTeamId(pool, code, group) {
  if (!code) return null;

  const result = await pool.query(
    `
      select id
      from teams
      where code = $1
        and ($2::text is null or group_id = $2)
      order by created_at asc
      limit 1
    `,
    [code, group ?? null]
  );

  return result.rows[0]?.id ?? null;
}

async function upsertMatches(pool, matches) {
  for (const match of matches) {
    const homeTeamId = await resolveTeamId(pool, match.homeTeamCode ?? null, match.groupName ?? null);
    const awayTeamId = await resolveTeamId(pool, match.awayTeamCode ?? null, match.groupName ?? null);

    if (match.homeTeamCode) {
      assert(homeTeamId, `Nao encontrei a selecao da casa ${match.homeTeamCode} para o jogo ${match.externalId}.`);
    }

    if (match.awayTeamCode) {
      assert(awayTeamId, `Nao encontrei a selecao visitante ${match.awayTeamCode} para o jogo ${match.externalId}.`);
    }

    await pool.query(
      `
        insert into matches (
          external_id,
          fifa_match_number,
          stage,
          stage_label,
          group_name,
          home_team_id,
          away_team_id,
          home_slot_label,
          away_slot_label,
          kickoff_at_utc,
          stadium,
          city,
          country,
          status,
          home_score,
          away_score
        )
        values (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16
        )
        on conflict (external_id) do update set
          fifa_match_number = excluded.fifa_match_number,
          stage = excluded.stage,
          stage_label = excluded.stage_label,
          group_name = excluded.group_name,
          home_team_id = excluded.home_team_id,
          away_team_id = excluded.away_team_id,
          home_slot_label = excluded.home_slot_label,
          away_slot_label = excluded.away_slot_label,
          kickoff_at_utc = excluded.kickoff_at_utc,
          stadium = excluded.stadium,
          city = excluded.city,
          country = excluded.country,
          status = excluded.status,
          home_score = excluded.home_score,
          away_score = excluded.away_score
      `,
      [
        match.externalId,
        match.fifaMatchNumber ?? null,
        match.stage,
        match.stageLabel,
        match.groupName ?? null,
        homeTeamId,
        awayTeamId,
        match.homeSlotLabel ?? null,
        match.awaySlotLabel ?? null,
        match.kickoffAtUtc,
        match.stadium ?? null,
        match.city ?? null,
        match.country ?? null,
        normalizeStatus(match.status),
        match.homeScore ?? null,
        match.awayScore ?? null
      ]
    );
  }
}

async function removeStaleMatches(pool, matches) {
  const externalIds = matches.map((match) => match.externalId);

  await pool.query(
    `
      delete from matches
      where external_id is not null
        and not (external_id = any($1::text[]))
    `,
    [externalIds]
  );
}

async function main() {
  const [groups, teams, matches] = await Promise.all([
    readJson(groupsPath),
    readJson(teamsPath),
    readJson(matchesPath)
  ]);

  validateGroups(groups);
  validateTeams(teams);
  validateMatches(matches);

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await upsertGroups(pool, groups);
    await upsertTeams(pool, teams);
    await upsertMatches(pool, matches);
    await removeStaleMatches(pool, matches);

    console.log(
      `Importacao concluida: ${groups.length} grupos, ${teams.length} selecoes e ${matches.length} jogos processados.`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Falha ao importar seeds.");
  console.error(error);
  process.exit(1);
});
