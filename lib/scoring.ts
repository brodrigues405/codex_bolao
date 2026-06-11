import type { Match, Prediction } from "@/lib/types";

function getResultCode(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}

export function scorePrediction(match: Match, prediction: Prediction) {
  if (!match.officialScore) {
    return { points: 0, exactHit: false, resultHit: false };
  }

  const exactHit =
    match.officialScore.homeScore === prediction.homeScore &&
    match.officialScore.awayScore === prediction.awayScore;

  const resultHit =
    getResultCode(match.officialScore.homeScore, match.officialScore.awayScore) ===
    getResultCode(prediction.homeScore, prediction.awayScore);

  if (exactHit) {
    return { points: 5, exactHit: true, resultHit: true };
  }

  if (resultHit) {
    return { points: 2, exactHit: false, resultHit: true };
  }

  return { points: 0, exactHit: false, resultHit: false };
}
