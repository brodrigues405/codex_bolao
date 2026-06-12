import Image from "next/image";
import Link from "next/link";
import { requireReadySessionUser } from "@/lib/auth";
import { getCurrentUserDashboard, getLeaderboard, getUpcomingMatches } from "@/lib/data";

function FlagBadge({ name, url }: { name: string; url?: string }) {
  if (!url) {
    return <span className="flag-placeholder">A definir</span>;
  }

  return <Image alt={`Bandeira de ${name}`} className="team-flag" height={26} src={url} width={38} />;
}

export default async function DashboardPage() {
  const user = await requireReadySessionUser();
  const [dashboard, leaderboard, upcoming] = await Promise.all([
    getCurrentUserDashboard(user.id),
    getLeaderboard(),
    getUpcomingMatches()
  ]);
  const futureMatches = upcoming.filter((match) => new Date(match.kickoffAtUtc).getTime() > Date.now());
  const leader = leaderboard[0];
  const pointsGap = leader ? Math.max(leader.points - dashboard.points, 0) : 0;

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
              <p className="muted">Aqui aparecem apenas os jogos que ainda podem entrar no seu radar.</p>
            </div>
          </div>
          <div className="stack">
            {futureMatches.slice(0, 5).map((match) => (
              <div className="match-row" key={match.id}>
                <div>
                  <strong>{match.stageLabel}</strong>
                  <div className="muted">{match.kickoffLabel}</div>
                </div>
                <div className="match-score">
                  <span className="match-team">
                    <FlagBadge name={match.homeTeam} url={match.homeFlagUrl} />
                    <span>{match.homeTeam}</span>
                  </span>
                  <span className="score-pill">vs</span>
                  <span className="match-team">
                    <FlagBadge name={match.awayTeam} url={match.awayFlagUrl} />
                    <span>{match.awayTeam}</span>
                  </span>
                </div>
                <span className={`status-pill ${match.statusClass}`}>{match.statusLabel}</span>
              </div>
            ))}
            {futureMatches.length === 0 ? <div className="banner">Nenhum proximo jogo disponivel no momento.</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Minha situacao no ranking</h2>
              <p className="muted">Resumo pessoal para acompanhar sua disputa sem repetir a home.</p>
            </div>
          </div>
          <div className="stack">
            <div className="admin-item">
              <div>
                <strong>Sua colocacao atual</strong>
                <div className="muted">
                  {dashboard.position > 0
                    ? `${dashboard.position}o lugar entre ${leaderboard.length} participantes`
                    : "Voce ainda nao entrou no ranking"}
                </div>
              </div>
              <span className="status-pill open">{dashboard.position > 0 ? `${dashboard.position}o` : "--"}</span>
            </div>

            <div className="admin-item">
              <div>
                <strong>Lider atual</strong>
                <div className="muted">
                  {leader ? `${leader.name} com ${leader.points} ponto(s)` : "Nenhum participante no ranking ainda"}
                </div>
              </div>
              <span className="status-pill">{leader ? `${pointsGap} atras` : "--"}</span>
            </div>

            <div className="admin-item">
              <div>
                <strong>Leitura rapida</strong>
                <div className="muted">
                  O ranking da home e o ranking completo usam a mesma classificacao geral. No dashboard, deixamos o foco no
                  seu contexto.
                </div>
              </div>
              <Link className="button button-secondary" href="/ranking">
                Ver ranking completo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
