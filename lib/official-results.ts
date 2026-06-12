import { query } from "@/lib/db";

const OFFICIAL_GAMES_API_URL = "https://worldcup26.ir/get/games";

interface ExternalGame {
  id: string;
  home_score?: string;
  away_score?: string;
  finished?: string;
  time_elapsed?: string;
}

interface ExternalGamesResponse {
  games?: ExternalGame[];
}

function normalizeApiFlag(value?: string) {
  return value?.trim().toUpperCase() === "TRUE";
}

function normalizeElapsed(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function toMatchStatus(game: ExternalGame): "scheduled" | "in_progress" | "finished" {
  const elapsed = normalizeElapsed(game.time_elapsed);

  if (normalizeApiFlag(game.finished) || elapsed === "finished" || elapsed === "ft") {
    return "finished";
  }

  if (elapsed && elapsed !== "notstarted") {
    return "in_progress";
  }

  return "scheduled";
}

function parseScore(value?: string) {
  if (value === undefined || value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function syncOfficialResults() {
  const response = await fetch(OFFICIAL_GAMES_API_URL, {
    headers: {
      Accept: "application/json"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar resultados oficiais: HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as ExternalGamesResponse;

  if (!payload.games || !Array.isArray(payload.games)) {
    throw new Error("Resposta invalida da API de resultados oficiais.");
  }

  let updated = 0;

  for (const game of payload.games) {
    const fifaMatchNumber = Number(game.id);

    if (!Number.isInteger(fifaMatchNumber)) {
      continue;
    }

    const status = toMatchStatus(game);
    const homeScore = status === "finished" ? parseScore(game.home_score) : null;
    const awayScore = status === "finished" ? parseScore(game.away_score) : null;

    const result = await query<{ id: string }>(
      `
        update matches
        set status = $2,
            home_score = $3,
            away_score = $4
        where fifa_match_number = $1
        returning id
      `,
      [fifaMatchNumber, status, homeScore, awayScore]
    );

    updated += result.rowCount ?? 0;
  }

  return {
    updated,
    sourceCount: payload.games.length
  };
}
