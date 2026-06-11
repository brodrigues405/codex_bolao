import { requireSessionUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/data";

export default async function RankingPage() {
  await requireSessionUser();
  const leaderboard = await getLeaderboard();

  return (
    <section className="stack">
      <div className="panel">
        <span className="eyebrow">Ranking geral</span>
        <h1 className="section-title">Classificacao do bolao</h1>
        <p className="lead">
          Os pontos sao calculados de forma deterministica: `5` para placar exato, `2` para acertar
          vencedor ou empate e `0` para erro total.
        </p>
      </div>

      <div className="card">
        <div className="table">
          <div className="table-head">
            <span>Pos</span>
            <span>Participante</span>
            <span>Pontos</span>
            <span>Exatos</span>
            <span>Resultados</span>
          </div>
          {leaderboard.map((entry) => (
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
  );
}
