import groupsJson from "@/seed/groups.json";
import matchesJson from "@/seed/matches.json";
import teamsJson from "@/seed/teams.json";
import { query } from "@/lib/db";

type SeedStatus = "scheduled" | "in_progress" | "finished" | "open" | "locked" | "done";

interface SeedGroup {
  id: string;
  name: string;
}

interface SeedTeam {
  code: string;
  name: string;
  group: string;
  flagUrl?: string;
}

interface SeedMatch {
  externalId: string;
  fifaMatchNumber?: number;
  stage: string;
  stageLabel: string;
  groupName?: string;
  homeTeamCode?: string;
  awayTeamCode?: string;
  homeSlotLabel?: string;
  awaySlotLabel?: string;
  kickoffAtUtc: string;
  stadium?: string;
  city?: string;
  country?: string;
  status?: SeedStatus;
  homeScore?: number;
  awayScore?: number;
}

const groups = groupsJson as SeedGroup[];
const teams = teamsJson as SeedTeam[];
const matches = matchesJson as SeedMatch[];

function normalizeStatus(status?: SeedStatus) {
  if (!status || status === "open") return "scheduled";
  if (status === "locked") return "in_progress";
  if (status === "done") return "finished";
  return status;
}

async function resolveTeamId(code?: string, group?: string) {
  if (!code) return null;

  const result = await query<{ id: string }>(
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

async function upsertGroups() {
  for (const group of groups) {
    await query(
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

async function upsertTeams() {
  for (const team of teams) {
    await query(
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

async function upsertMatches() {
  for (const match of matches) {
    const homeTeamId = await resolveTeamId(match.homeTeamCode, match.groupName);
    const awayTeamId = await resolveTeamId(match.awayTeamCode, match.groupName);

    if (match.homeTeamCode && !homeTeamId) {
      throw new Error(`Nao encontrei a selecao da casa ${match.homeTeamCode} para o jogo ${match.externalId}.`);
    }

    if (match.awayTeamCode && !awayTeamId) {
      throw new Error(`Nao encontrei a selecao visitante ${match.awayTeamCode} para o jogo ${match.externalId}.`);
    }

    await query(
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

async function removeStaleMatches() {
  await query(
    `
      delete from matches
      where external_id is not null
        and not (external_id = any($1::text[]))
    `,
    [matches.map((match) => match.externalId)]
  );
}

export function getOfficialSeedCounts() {
  return {
    groups: groups.length,
    teams: teams.length,
    matches: matches.length
  };
}

export async function syncOfficialSeeds() {
  await upsertGroups();
  await upsertTeams();
  await upsertMatches();
  await removeStaleMatches();

  return getOfficialSeedCounts();
}
