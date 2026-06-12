import { query } from "@/lib/db";
import { getFlagUrl } from "@/lib/flags";
import { formatKickoff } from "@/lib/format";
import { isLaunchMatchNumber } from "@/lib/launch-mode";
import { getOfficialGamesSnapshot, parseOfficialScore, toOfficialMatchStatus } from "@/lib/official-results";
import { getOfficialSeedCounts } from "@/lib/official-seeds";
import { scorePrediction } from "@/lib/scoring";
import type {
  DecoratedMatch,
  LeaderboardEntry,
  LaunchMatchLeaderboardEntry,
  ManagedUser,
  Match,
  MatchStatusClass,
  PeerPrediction,
  Prediction,
  PredictionBoardMatch,
  Role,
  User
} from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __bolaoUserLeagueSchemaPromise: Promise<void> | undefined;
}

interface DbUserRow extends Record<string, unknown> {
  id: string;
  name: string;
  username: string;
  role: Role;
  is_active: boolean;
  paid: boolean;
  league_eligible: boolean;
  league_opt_in: boolean;
}

interface DbManagedUserRow extends DbUserRow {
  prediction_count: number;
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

async function ensureUserLeagueSchema() {
  if (!global.__bolaoUserLeagueSchemaPromise) {
    global.__bolaoUserLeagueSchemaPromise = query(`
      alter table app_users
      add column if not exists league_eligible boolean not null default false;

      alter table app_users
      add column if not exists league_opt_in boolean not null default false

      ;

      alter table app_users
      add column if not exists paid boolean not null default false
    `).then(() => undefined);
  }

  return global.__bolaoUserLeagueSchemaPromise;
}

function getMatchStatus(row: DbMatchRow): Match["status"] {
  if (row.home_score !== null && row.away_score !== null) return "finished";
  if (row.status === "finished") return "finished";
  if (row.status === "in_progress") return "locked";
  if (new Date(row.kickoff_at_utc).getTime() <= Date.now()) return "locked";
  return "open";
}

function mapDbStatusToMatchStatus(status: DbMatchRow["status"]): Match["status"] {
  if (status === "finished") return "finished";
  if (status === "in_progress") return "locked";
  return "open";
}

function toStatusLabel(status: Match["status"]) {
  if (status === "open") return "aberto";
  if (status === "locked") return "travado";
  return "finalizado";
}

function toStatusClass(status: Match["status"]): MatchStatusClass {
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
    isActive: row.is_active,
    paid: row.paid,
    leagueEligible: row.league_eligible,
    leagueOptIn: row.league_opt_in
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
        : undefined,
    isLaunchMatch: isLaunchMatchNumber(row.fifa_match_number)
  };
}

async function getUsers() {
  await ensureUserLeagueSchema();

  const result = await query<DbUserRow>(
    "select id, name, username, role, is_active, paid, league_eligible, league_opt_in from app_users order by role desc, name asc"
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

  let officialGamesByNumber = new Map<number, Awaited<ReturnType<typeof getOfficialGamesSnapshot>>[number]>();

  try {
    const officialGames = await getOfficialGamesSnapshot();
    officialGamesByNumber = new Map(
      officialGames
        .map((game) => [Number(game.id), game] as const)
        .filter(([matchNumber]) => Number.isInteger(matchNumber))
    );
  } catch {
    officialGamesByNumber = new Map();
  }

  const normalized = result.rows.map((row) => {
    const baseMatch = normalizeMatch(row);
    const officialGame = row.fifa_match_number ? officialGamesByNumber.get(row.fifa_match_number) : undefined;

    if (!officialGame) {
      return baseMatch;
    }

    const externalStatus = toOfficialMatchStatus(officialGame);
    const externalHomeScore = parseOfficialScore(officialGame.home_score);
    const externalAwayScore = parseOfficialScore(officialGame.away_score);
    const dbStatus = mapDbStatusToMatchStatus(row.status);
    const mergedStatus =
      externalStatus === "finished"
        ? "finished"
        : dbStatus === "finished"
          ? "finished"
          : externalStatus === "in_progress" || dbStatus === "locked"
            ? "locked"
            : baseMatch.status;
    const mergedOfficialScore =
      externalStatus === "finished" && externalHomeScore !== null && externalAwayScore !== null
        ? { homeScore: externalHomeScore, awayScore: externalAwayScore }
        : baseMatch.officialScore;

    return {
      ...baseMatch,
      status: mergedStatus,
      officialScore: mergedOfficialScore
    };
  });
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
  const launchMatch = matches.find((match) => match.isLaunchMatch);
  const launchKickoff = launchMatch ? new Date(launchMatch.kickoffAtUtc).getTime() : Number.NEGATIVE_INFINITY;

  return users
    .filter((user) => user.role === "participant" && user.isActive && user.leagueOptIn)
    .map((user) => {
      const userPredictions = predictions.filter((prediction) => {
        if (prediction.userId !== user.id) return false;

        const match = matches.find((item) => item.id === prediction.matchId);
        if (!match) return false;

        return new Date(match.kickoffAtUtc).getTime() >= launchKickoff;
      });
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

export async function getLaunchMatchLeaderboard(): Promise<LaunchMatchLeaderboardEntry[]> {
  const [users, matches, predictions] = await Promise.all([getUsers(), getMatches(), getPredictions()]);
  const launchMatch = matches.find((match) => match.isLaunchMatch);

  if (!launchMatch) {
    return [];
  }

  return users
    .filter((user) => user.role === "participant" && user.isActive)
    .map((user) => {
      const prediction = predictions.find((item) => item.userId === user.id && item.matchId === launchMatch.id);

      if (!prediction) {
        return null;
      }

      const score = scorePrediction(launchMatch, prediction);

      return {
        userId: user.id,
        name: user.name,
        position: 0,
        points: score.points,
        exactHits: Number(score.exactHit),
        resultHits: Number(score.resultHit),
        joinedGeneralLeague: Boolean(user.leagueOptIn)
      };
    })
    .filter((entry): entry is LaunchMatchLeaderboardEntry => entry !== null)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      return b.resultHits - a.resultHits;
    })
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

export async function getLaunchMatch() {
  const matches = await getMatches();
  const match = matches.find((item) => item.isLaunchMatch);

  if (!match) {
    return null;
  }

  return {
    ...match,
    kickoffLabel: formatKickoff(match.kickoffAtUtc),
    statusLabel: toStatusLabel(match.status),
    statusClass: toStatusClass(match.status)
  };
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

export async function getUpcomingMatches(): Promise<DecoratedMatch[]> {
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

export async function getAgendaMatches(): Promise<DecoratedMatch[]> {
  const matches = await getMatches();

  return matches.map((match) => ({
    ...match,
    kickoffLabel: formatKickoff(match.kickoffAtUtc),
    statusLabel: toStatusLabel(match.status),
    statusClass: toStatusClass(match.status)
  }));
}

export async function getPredictionBoard(userId: string): Promise<PredictionBoardMatch[]> {
  const [matches, predictions, users] = await Promise.all([getMatches(), getPredictions(), getUsers()]);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const currentUser = usersById.get(userId);

  return matches
    .map((match) => ({
      ...match,
      kickoffLabel: formatKickoff(match.kickoffAtUtc),
      statusLabel: toStatusLabel(match.status),
      statusClass: toStatusClass(match.status),
      userPrediction: predictions.find((prediction) => prediction.userId === userId && prediction.matchId === match.id),
      peerPredictions: predictions
        .filter((prediction) => prediction.matchId === match.id && prediction.userId !== userId)
        .map((prediction): PeerPrediction | null => {
          const author = usersById.get(prediction.userId);

          if (!author || author.role !== "participant" || !author.isActive) {
            return null;
          }

          return {
            userId: prediction.userId,
            name: author.name,
            homeScore: prediction.homeScore,
            awayScore: prediction.awayScore
          };
        })
        .filter((prediction): prediction is PeerPrediction => prediction !== null),
      userLeagueOptIn: currentUser?.leagueOptIn
    }))
    .sort((a, b) => {
      if (a.isLaunchMatch && !b.isLaunchMatch) return -1;
      if (!a.isLaunchMatch && b.isLaunchMatch) return 1;
      return new Date(a.kickoffAtUtc).getTime() - new Date(b.kickoffAtUtc).getTime();
    });
}

export async function getManagedUsers() {
  await ensureUserLeagueSchema();

  const result = await query<DbManagedUserRow>(
    `
      select
        users.id,
        users.name,
        users.username,
        users.role,
        users.is_active,
        users.paid,
        users.league_eligible,
        users.league_opt_in,
        count(predictions.id)::int as prediction_count
      from app_users as users
      left join predictions on predictions.user_id = users.id
      group by users.id, users.name, users.username, users.role, users.is_active, users.paid, users.league_eligible, users.league_opt_in
      order by users.role desc, users.is_active desc, users.name asc
    `
  );

  return result.rows.map(
    (row): ManagedUser => ({
      ...normalizeUser(row),
      predictionCount: row.prediction_count
    })
  );
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
