import type { LeaderboardEntry, LaunchMatchLeaderboardEntry } from "@/lib/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[] | LaunchMatchLeaderboardEntry[];
  variant?: "general" | "launch";
}

function isLaunchEntry(entry: LeaderboardEntry | LaunchMatchLeaderboardEntry): entry is LaunchMatchLeaderboardEntry {
  return "joinedGeneralLeague" in entry;
}

export function LeaderboardTable({ entries, variant = "general" }: LeaderboardTableProps) {
  if (variant === "launch") {
    return (
      <div className="table leaderboard-table leaderboard-table-launch">
        <div className="table-head ranking-table-head ranking-table-head-launch">
          <span>Pos</span>
          <span>Participante</span>
          <span>Pontos</span>
          <span>Exatos</span>
          <span>Resultados</span>
          <span>Liga Geral</span>
        </div>
        {entries.map((entry) => {
          const launchEntry = isLaunchEntry(entry) ? entry : null;

          return (
            <div className="table-row ranking-table-row ranking-table-row-launch leaderboard-row" key={entry.userId}>
              <span className="leaderboard-cell leaderboard-cell-position" data-label="Pos">
                <strong>{entry.position}</strong>
              </span>
              <span className="leaderboard-cell leaderboard-cell-name" data-label="Participante">
                {entry.name}
              </span>
              <span className="leaderboard-cell" data-label="Pontos">
                <strong>{entry.points}</strong>
              </span>
              <span className="leaderboard-cell" data-label="Exatos">
                {entry.exactHits}
              </span>
              <span className="leaderboard-cell" data-label="Resultados">
                {entry.resultHits}
              </span>
              <span className="leaderboard-cell" data-label="Liga Geral">
                {launchEntry?.joinedGeneralLeague ? "Entrou" : "So jogo avulso"}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="table leaderboard-table">
      <div className="table-head ranking-table-head">
        <span>Pos</span>
        <span>Participante</span>
        <span>Pontos</span>
        <span>Exatos</span>
        <span>Resultados</span>
      </div>
      {entries.map((entry) => (
        <div className="table-row ranking-table-row leaderboard-row" key={entry.userId}>
          <span className="leaderboard-cell leaderboard-cell-position" data-label="Pos">
            <strong>{entry.position}</strong>
          </span>
          <span className="leaderboard-cell leaderboard-cell-name" data-label="Participante">
            {entry.name}
          </span>
          <span className="leaderboard-cell" data-label="Pontos">
            <strong>{entry.points}</strong>
          </span>
          <span className="leaderboard-cell" data-label="Exatos">
            {entry.exactHits}
          </span>
          <span className="leaderboard-cell" data-label="Resultados">
            {entry.resultHits}
          </span>
        </div>
      ))}
    </div>
  );
}
