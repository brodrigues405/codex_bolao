import Image from "next/image";
import { requireSessionUser } from "@/lib/auth";
import { PredictionForm } from "@/components/prediction-form";
import { getPredictionBoard } from "@/lib/data";

function formatVenue(stadium?: string, city?: string) {
  if (stadium && city) return `${stadium}, ${city}`;
  return stadium ?? city ?? "Local a definir";
}

function FlagBadge({ name, url }: { name: string; url?: string }) {
  if (!url) {
    return <span className="flag-placeholder">A definir</span>;
  }

  return <Image alt={`Bandeira de ${name}`} className="team-flag" height={26} src={url} width={38} />;
}

export default async function PalpitesPage() {
  const user = await requireSessionUser();
  const matches = await getPredictionBoard(user.id);

  return (
    <section className="stack">
      <div className="panel">
        <span className="eyebrow">Palpites</span>
        <h1 className="section-title">Editar palpites do usuario</h1>
        <p className="lead">
          Informe os placares antes do inicio de cada partida. Jogos travados continuam visiveis para consulta.
        </p>
      </div>

      {matches.map((match) => (
        <div className="card prediction-card" key={match.id}>
          <div className="prediction-card-header">
            <div>
              <span className="eyebrow">{match.stageLabel}</span>
              <h2 className="prediction-title">
                {match.fifaMatchNumber ? `Jogo ${match.fifaMatchNumber}` : match.stageLabel}
              </h2>
              <div className="prediction-meta">
                <span>{formatVenue(match.stadium, match.city)}</span>
                <strong>{match.kickoffLabel}</strong>
              </div>
            </div>
            <span className={`status-pill ${match.statusClass}`}>{match.statusLabel}</span>
          </div>

          <div className="prediction-teams" aria-label={`${match.homeTeam} contra ${match.awayTeam}`}>
            <div className="prediction-team home">
              <span className="team-name">{match.homeTeam}</span>
              <FlagBadge name={match.homeTeam} url={match.homeFlagUrl} />
              {match.homeTeamCode ? <span className="team-code">{match.homeTeamCode}</span> : null}
            </div>

            <div className="fixture-separator">x</div>

            <div className="prediction-team away">
              <FlagBadge name={match.awayTeam} url={match.awayFlagUrl} />
              <span className="team-name">{match.awayTeam}</span>
              {match.awayTeamCode ? <span className="team-code">{match.awayTeamCode}</span> : null}
            </div>
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
