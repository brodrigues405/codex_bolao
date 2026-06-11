import { requireSessionUser } from "@/lib/auth";
import { PredictionForm } from "@/components/prediction-form";
import { getPredictionBoard } from "@/lib/data";

export default async function PalpitesPage() {
  const user = await requireSessionUser();
  const matches = await getPredictionBoard(user.id);

  return (
    <section className="stack">
      <div className="panel">
        <span className="eyebrow">Palpites</span>
        <h1 className="section-title">Editar palpites do usuario</h1>
        <p className="lead">
          Os palpites agora podem ser salvos e atualizados direto nesta tela. O bloqueio continua
          respeitando o horario oficial de cada partida.
        </p>
      </div>

      {matches.map((match) => (
        <div className="card" key={match.id}>
          <div className="section-header">
            <div>
              <strong>{match.stageLabel}</strong>
              <div className="muted">
                {match.homeTeam} x {match.awayTeam} • {match.kickoffLabel}
              </div>
            </div>
            <span className={`status-pill ${match.statusClass}`}>{match.statusLabel}</span>
          </div>

          <PredictionForm
            awayScore={match.userPrediction?.awayScore ?? null}
            awayTeam={match.awayTeam}
            canEdit={match.status === "open"}
            homeScore={match.userPrediction?.homeScore ?? null}
            homeTeam={match.homeTeam}
            matchId={match.id}
          />
        </div>
      ))}
    </section>
  );
}
