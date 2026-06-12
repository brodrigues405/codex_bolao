import Link from "next/link";
import { ArrowRight, BadgeCheck, ChartColumn } from "lucide-react";
import { HomeAgendaTabs } from "@/components/home-agenda-tabs";
import { getSessionUser } from "@/lib/auth";
import { getAdminSummary, getLeaderboard, getUpcomingMatches } from "@/lib/data";

export default async function HomePage() {
  const user = await getSessionUser();
  const agendaActionHref = user ? (user.mustChangePassword ? "/primeiro-acesso" : "/palpites") : "/login";
  const agendaActionLabel = user ? "Palpitar" : "Entrar";
  const [summary, leaderboard, upcoming] = await Promise.all([
    getAdminSummary(),
    getLeaderboard(),
    getUpcomingMatches()
  ]);

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
            <Link className="button button-primary" href={user ? (user.mustChangePassword ? "/primeiro-acesso" : "/dashboard") : "/login"}>
              {user ? (user.mustChangePassword ? "Continuar acesso" : "Abrir dashboard") : "Entrar no bolao"}
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
    </>
  );
}
