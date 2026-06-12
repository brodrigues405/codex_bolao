import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, BadgeCheck, ChartColumn } from "lucide-react";
import { HomeAgendaTabs } from "@/components/home-agenda-tabs";
import { HomeHubTabs } from "@/components/home-hub-tabs";
import { getSessionUser } from "@/lib/auth";
import { getAdminSummary, getAgendaMatches, getCurrentUserDashboard, getLaunchMatch, getLeaderboard } from "@/lib/data";

export default async function HomePage() {
  const user = await getSessionUser();
  const agendaActionHref: Route = user ? (user.mustChangePassword ? "/primeiro-acesso" : "/palpites") : "/login";
  const agendaActionLabel = user ? "Palpitar" : "Entrar";
  const [summary, leaderboard, upcoming, participantDashboard] = await Promise.all([
    getAdminSummary(),
    getLeaderboard(),
    getAgendaMatches(),
    user && !user.mustChangePassword ? getCurrentUserDashboard(user.id) : Promise.resolve(null)
  ]);
  const launchMatch = await getLaunchMatch();
  const leader = leaderboard[0];
  const pointsGap = leader && participantDashboard ? Math.max(leader.points - participantDashboard.points, 0) : 0;
  const primaryActionHref: Route = user ? (user.mustChangePassword ? "/primeiro-acesso" : "/palpites") : "/login";
  const primaryActionLabel = user ? (user.mustChangePassword ? "Continuar acesso" : "Fazer palpites") : "Entrar no bolao";

  const publicContent = (
    <section className="section grid-2">
      <div className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">
              <ChartColumn size={16} />
              Top 5
            </p>
            <h2 className="section-title">Ranking resumido</h2>
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
          {leaderboard.slice(0, 5).map((entry) => (
            <div className="table-row" key={entry.userId}>
              <strong>{entry.position}</strong>
              <span>{entry.name}</span>
              <strong>{entry.points}</strong>
              <span>{entry.exactHits}</span>
              <span>{entry.resultHits}</span>
            </div>
          ))}
          {leaderboard.length === 0 ? <div className="banner">Nenhum participante cadastrado ainda.</div> : null}
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">
              <BadgeCheck size={16} />
              Agenda
            </p>
          </div>
        </div>
        <HomeAgendaTabs actionHref={agendaActionHref} actionLabel={agendaActionLabel} matches={upcoming} />
      </div>
    </section>
  );

  const participantContent = participantDashboard ? (
    <section className="section stack">
      <div className="grid-4">
        <div className="card">
          <div className="metric">
            <small>Meus pontos</small>
            <strong>{participantDashboard.points}</strong>
            <span className="muted">Pontuacao acumulada no torneio.</span>
          </div>
        </div>
        <div className="card">
          <div className="metric">
            <small>Posicao</small>
            <strong>{participantDashboard.position > 0 ? `${participantDashboard.position}o` : "--"}</strong>
            <span className="muted">Atualizada a cada resultado oficial.</span>
          </div>
        </div>
        <div className="card">
          <div className="metric">
            <small>Placares exatos</small>
            <strong>{participantDashboard.exactHits}</strong>
            <span className="muted">Maior peso no ranking.</span>
          </div>
        </div>
        <div className="card">
          <div className="metric">
            <small>Palpites feitos</small>
            <strong>{participantDashboard.predictions}</strong>
            <span className="muted">Total enviado pelo usuario atual.</span>
          </div>
        </div>
      </div>

      <section className="grid-2">
        <div className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">
                <ChartColumn size={16} />
                Minha disputa
              </p>
              <h2 className="section-title">Situacao no ranking</h2>
            </div>
            <Link className="button button-secondary" href="/ranking">
              Ver ranking completo
            </Link>
          </div>
          <div className="stack">
            <div className="admin-item">
              <div>
                <strong>Sua colocacao atual</strong>
                <div className="muted">
                  {participantDashboard.position > 0
                    ? `${participantDashboard.position}o lugar entre ${leaderboard.length} participantes`
                    : "Voce ainda nao entrou no ranking"}
                </div>
              </div>
              <span className="status-pill open">
                {participantDashboard.position > 0 ? `${participantDashboard.position}o` : "--"}
              </span>
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
                  Use a aba `Dados do bolao` para consultar agenda e ranking geral. Aqui fica so o seu recorte pessoal.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">
                <BadgeCheck size={16} />
                Proximos passos
              </p>
              <h2 className="section-title">Acoes rapidas</h2>
            </div>
          </div>
          <div className="stack">
            <div className="admin-item">
              <div>
                <strong>Preencher palpites</strong>
                <div className="muted">Abra a tela de palpites para enviar ou ajustar seus placares.</div>
              </div>
              <Link className="button button-secondary" href="/palpites">
                Abrir palpites
              </Link>
            </div>
            <div className="admin-item">
              <div>
                <strong>Consultar agenda</strong>
                <div className="muted">Os proximos jogos e o andamento do bolao continuam na aba `Dados do bolao`.</div>
              </div>
              <button className="button button-secondary" disabled type="button">
                Veja acima
              </button>
            </div>
            <div className="admin-item">
              <div>
                <strong>Comparar desempenho</strong>
                <div className="muted">Consulte a classificacao completa quando quiser entender sua distancia no ranking.</div>
              </div>
              <Link className="button button-secondary" href="/ranking">
                Abrir ranking
              </Link>
            </div>
          </div>
        </div>
      </section>
    </section>
  ) : null;

  return (
    <>
      <section className="stack">
        <div className="panel">
          <span className="eyebrow">Inicio</span>
          <h1 className="section-title">Bolao Copa 2026</h1>
          <p className="lead">
            Acompanhe os numeros principais do bolao, os proximos jogos abertos e o ranking resumido.
          </p>
          {user ? <p className="login-highlight">Conectado como <strong>{user.name}</strong>.</p> : null}
          <div className="button-row">
            <Link className="button button-primary" href={primaryActionHref}>
              {primaryActionLabel}
              <ArrowRight size={16} />
            </Link>
            {user ? (
              <Link
                className="button button-secondary"
                href={user.mustChangePassword ? "/primeiro-acesso" : user.role === "admin" ? "/admin" : "/palpites"}
              >
                {user.mustChangePassword ? "Trocar senha" : user.role === "admin" ? "Painel admin" : "Meus palpites"}
              </Link>
            ) : (
              <Link className="button button-secondary" href="/login">
                Login
              </Link>
            )}
          </div>
        </div>
        {launchMatch ? (
          <div className="card launch-card">
            <div className="launch-card-copy">
              <span className="eyebrow">Bolao de estreia</span>
              <h2 className="section-title">Bolao de estreia: Brasil x Marrocos</h2>
              <p className="lead launch-lead">
                O bolao comeca hoje em modo teste com o jogo do Brasil. Faca seu palpite, acompanhe o ranking do jogo e ajude a validar o sistema antes da abertura completa da Liga da Copa.
              </p>
              <div className="launch-match-line">
                {launchMatch.homeFlagUrl ? (
                  <Image
                    alt={`Bandeira de ${launchMatch.homeTeam}`}
                    className="team-flag"
                    height={26}
                    src={launchMatch.homeFlagUrl}
                    width={38}
                  />
                ) : null}
                <strong>{launchMatch.homeTeam}</strong>
                <span className="score-pill">x</span>
                {launchMatch.awayFlagUrl ? (
                  <Image
                    alt={`Bandeira de ${launchMatch.awayTeam}`}
                    className="team-flag"
                    height={26}
                    src={launchMatch.awayFlagUrl}
                    width={38}
                  />
                ) : null}
                <strong>{launchMatch.awayTeam}</strong>
              </div>
              <div className="prediction-meta">
                <span>{launchMatch.stageLabel}</span>
                <strong>{new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "America/Sao_Paulo"
                }).format(new Date(launchMatch.kickoffAtUtc))}</strong>
              </div>
              <div className="button-row">
                <a className="button button-primary" href="/palpites#launch-match">
                  Palpitar no jogo do Brasil
                  <ArrowRight size={16} />
                </a>
                <span className={`status-pill ${launchMatch.statusClass}`}>
                  {launchMatch.status === "open"
                    ? "Disponivel agora"
                    : launchMatch.status === "locked"
                      ? "Palpite bloqueado"
                      : "Resultado encerrado"}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid-3">
          <div className="card">
            <div className="metric">
              <small>Participantes</small>
              <strong>{summary.participants}</strong>
              <span className="muted">Usuarios ativos no bolao.</span>
            </div>
          </div>
          <div className="card">
            <div className="metric">
              <small>Jogos no ambiente</small>
              <strong>{summary.totalMatches}</strong>
              <span className="muted">Tabela completa da Copa.</span>
            </div>
          </div>
          <div className="card">
            <div className="metric">
              <small>Palpites enviados</small>
              <strong>{summary.predictions}</strong>
              <span className="muted">Total registrado pelos participantes.</span>
            </div>
          </div>
        </div>
      </section>
      <HomeHubTabs
        hasParticipantView={Boolean(participantContent)}
        participantContent={participantContent}
        publicContent={publicContent}
      />
    </>
  );
}
