import { requireSessionUser } from "@/lib/auth";
import { getCurrentUserDashboard, getLeaderboard, getUpcomingMatches } from "@/lib/data";

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const [dashboard, leaderboard, upcoming] = await Promise.all([
    getCurrentUserDashboard(user.id),
    getLeaderboard(),
    getUpcomingMatches()
  ]);

  return (
    <>
      <section className="grid-4">
        <div className="card">
          <div className="metric">
            <small>Meus pontos</small>
            <strong>{dashboard.points}</strong>
            <span className="muted">Pontuacao acumulada no torneio.</span>
          </div>
        </div>
        <div className="card">
          <div className="metric">
            <small>Posicao</small>
            <strong>{dashboard.position}o</strong>
            <span className="muted">Atualizada a cada resultado oficial.</span>
          </div>
        </div>
        <div className="card">
          <div className="metric">
            <small>Placares exatos</small>
            <strong>{dashboard.exactHits}</strong>
            <span className="muted">Maior peso no ranking.</span>
          </div>
        </div>
        <div className="card">
          <div className="metric">
            <small>Palpites feitos</small>
            <strong>{dashboard.predictions}</strong>
            <span className="muted">Total de palpites enviados pelo usuario atual.</span>
          </div>
        </div>
      </section>

      <section className="section grid-2">
        <div className="card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Meus proximos palpites</h2>
              <p className="muted">Os jogos ficam bloqueados automaticamente no horario oficial.</p>
            </div>
          </div>
          <div className="stack">
            {upcoming.slice(0, 5).map((match) => (
              <div className="match-row" key={match.id}>
                <div>
                  <strong>{match.stageLabel}</strong>
                  <div className="muted">{match.kickoffLabel}</div>
                </div>
                <div className="match-score">
                  <span>{match.homeTeam}</span>
                  <span className="score-pill">vs</span>
                  <span>{match.awayTeam}</span>
                </div>
                <span className={`status-pill ${match.statusClass}`}>{match.statusLabel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Ranking rapido</h2>
              <p className="muted">Resumo curto para consulta do participante.</p>
            </div>
          </div>
          <div className="table">
            <div className="table-head">
              <span>Pos</span>
              <span>Participante</span>
              <span>Pontos</span>
              <span>Exatos</span>
              <span>Resultados</span>
            </div>
            {leaderboard.slice(0, 6).map((entry) => (
              <div className="table-row" key={entry.userId}>
                <strong>{entry.position}</strong>
                <span>{entry.name}</span>
                <strong>{entry.points}</strong>
                <span>{entry.exactHits}</span>
                <span>{entry.resultHits}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
