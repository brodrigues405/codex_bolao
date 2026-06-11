import { query } from "@/lib/db";
import { getFlagUrl } from "@/lib/flags";
import { formatKickoff } from "@/lib/format";
import { getOfficialSeedCounts } from "@/lib/official-seeds";
import { scorePrediction } from "@/lib/scoring";
import type { LeaderboardEntry, Match, Prediction, Role, User } from "@/lib/types";

interface DbUserRow extends Record<string, unknown> {
  id: string;
  name: string;
  username: string;
  role: Role;
  is_active: boolean;
}

interface DbMatchRow extends Record<string, unknown> {
  id: string;
  fifa_match_number: number | null;
  stage: Match["stage"];
  stage_label: string;
  group_name: string | null;
  kickoff_at_utc: string;
  home_team: string;
  home_team_code: string | null;
  home_flag_url: string | null;
  away_team: string;
  away_team_code: string | null;
  away_flag_url: string | null;
  stadium: string | null;
  city: string | null;
  status: "scheduled" | "in_progress" | "finished";
  home_score: number | null;
  away_score: number | null;
}

interface DbPredictionRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
}

function getMatchStatus(row: DbMatchRow): Match["status"] {
  if (row.status === "finished") return "finished";
  if (row.status === "in_progress") return "locked";
  if (new Date(row.kickoff_at_utc).getTime() <= Date.now()) return "locked";
  return "open";
}

function toStatusLabel(status: Match["status"]) {
  if (status === "open") return "aberto";
  if (status === "locked") return "travado";
  return "finalizado";
}

function toStatusClass(status: Match["status"]) {
  if (status === "open") return "open";
  if (status === "locked") return "locked";
  return "done";
}

function normalizeUser(row: DbUserRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    isActive: row.is_active
  };
}

function normalizeMatch(row: DbMatchRow): Match {
  return {
    id: row.id,
    fifaMatchNumber: row.fifa_match_number ?? undefined,
    stage: row.stage,
    stageLabel: row.stage_label,
    groupName: row.group_name ?? undefined,
    kickoffAtUtc: row.kickoff_at_utc,
    homeTeam: row.home_team,
    homeTeamCode: row.home_team_code ?? undefined,
    homeFlagUrl: row.home_flag_url ?? getFlagUrl(row.home_team_code),
    awayTeam: row.away_team,
    awayTeamCode: row.away_team_code ?? undefined,
    awayFlagUrl: row.away_flag_url ?? getFlagUrl(row.away_team_code),
    stadium: row.stadium ?? undefined,
    city: row.city ?? undefined,
    status: getMatchStatus(row),
    officialScore:
      row.home_score !== null && row.away_score !== null
        ? { homeScore: row.home_score, awayScore: row.away_score }
        : undefined
  };
}

async function getUsers() {
  const result = await query<DbUserRow>(
    "select id, name, username, role, is_active from app_users order by role desc, name asc"
  );
  return result.rows.map(normalizeUser);
}

async function getMatches() {
  const result = await query<DbMatchRow>(
    `
      select
        matches.id,
        matches.fifa_match_number,
        matches.stage,
        matches.stage_label,
        matches.group_name,
        matches.kickoff_at_utc::text,
        coalesce(home_team.name, matches.home_slot_label, 'Selecao 1') as home_team,
        home_team.code as home_team_code,
        home_team.flag_url as home_flag_url,
        coalesce(away_team.name, matches.away_slot_label, 'Selecao 2') as away_team,
        away_team.code as away_team_code,
        away_team.flag_url as away_flag_url,
        matches.stadium,
        matches.city,
        matches.status,
        matches.home_score,
        matches.away_score
      from matches
      left join teams as home_team on home_team.id = matches.home_team_id
      left join teams as away_team on away_team.id = matches.away_team_id
      order by matches.kickoff_at_utc asc
    `
  );

  const normalized = result.rows.map(normalizeMatch);
  const seen = new Set<string>();

  return normalized.filter((match) => {
    const key = `${match.stage}|${match.groupName ?? ""}|${match.homeTeam}|${match.awayTeam}|${match.kickoffAtUtc}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function getPredictions() {
  const result = await query<DbPredictionRow>(
    `
      select id, user_id, match_id, predicted_home_score, predicted_away_score
      from predictions
      order by created_at asc
    `
  );

  return result.rows.map(
    (row): Prediction => ({
      id: row.id,
      userId: row.user_id,
      matchId: row.match_id,
      homeScore: row.predicted_home_score,
      awayScore: row.predicted_away_score
    })
  );
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const [users, matches, predictions] = await Promise.all([getUsers(), getMatches(), getPredictions()]);

  return users
    .filter((user) => user.role === "participant")
    .map((user) => {
      const userPredictions = predictions.filter((prediction) => prediction.userId === user.id);
      const totals = userPredictions.reduce(
        (accumulator, prediction) => {
          const match = matches.find((item) => item.id === prediction.matchId);

          if (!match) return accumulator;

          const score = scorePrediction(match, prediction);

          return {
            points: accumulator.points + score.points,
            exactHits: accumulator.exactHits + Number(score.exactHit),
            resultHits: accumulator.resultHits + Number(score.resultHit)
          };
        },
        { points: 0, exactHits: 0, resultHits: 0 }
      );

      return {
        userId: user.id,
        name: user.name,
        position: 0,
        points: totals.points,
        exactHits: totals.exactHits,
        resultHits: totals.resultHits
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      return b.resultHits - a.resultHits;
    })
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

export async function getCurrentUserDashboard(userId: string) {
  const [leaderboard, predictions] = await Promise.all([getLeaderboard(), getPredictions()]);
  const current = leaderboard.find((entry) => entry.userId === userId);

  return {
    points: current?.points ?? 0,
    position: current?.position ?? 0,
    exactHits: current?.exactHits ?? 0,
    predictions: predictions.filter((prediction) => prediction.userId === userId).length
  };
}

export async function getUpcomingMatches() {
  const matches = await getMatches();

  return matches
    .filter((match) => match.status !== "finished")
    .map((match) => ({
      ...match,
      kickoffLabel: formatKickoff(match.kickoffAtUtc),
      statusLabel: toStatusLabel(match.status),
      statusClass: toStatusClass(match.status)
    }));
}

export async function getPredictionBoard(userId: string) {
  const [matches, predictions] = await Promise.all([getMatches(), getPredictions()]);

  return matches.map((match) => ({
    ...match,
    kickoffLabel: formatKickoff(match.kickoffAtUtc),
    statusLabel: toStatusLabel(match.status),
    statusClass: toStatusClass(match.status),
    userPrediction: predictions.find((prediction) => prediction.userId === userId && prediction.matchId === match.id)
  }));
}

export async function getManagedUsers() {
  return getUsers();
}

export async function getAdminSummary() {
  const [users, matches, predictions] = await Promise.all([getUsers(), getMatches(), getPredictions()]);

  return {
    participants: users.filter((user) => user.role === "participant" && user.isActive).length,
    totalMatches: matches.length,
    finishedMatches: matches.filter((match) => match.status === "finished").length,
    predictions: predictions.length
  };
}

export function getImportChecklist() {
  const officialCounts = getOfficialSeedCounts();

  return [
    {
      title: "Importar grupos",
      description: `Arquivo local com ${officialCounts.groups} grupos da Copa.`,
      statusLabel: "ok",
      statusClass: "open"
    },
    {
      title: "Importar selecoes",
      description: `Arquivo oficial com ${officialCounts.teams} selecoes da Copa.`,
      statusLabel: "ok",
      statusClass: "open"
    },
    {
      title: "Importar jogos",
      description: `Fonte local com ${officialCounts.matches} jogos da Copa.`,
      statusLabel: `${officialCounts.matches} jogos`,
      statusClass: "open"
    }
  ];
}
