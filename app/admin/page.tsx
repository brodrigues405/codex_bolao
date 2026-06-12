import { syncOfficialResultsAction, syncOfficialSeedsAction } from "@/app/actions";
import { AdminUserManager } from "@/components/admin-user-manager";
import { requireAdminUser } from "@/lib/auth";
import { getAdminSummary, getImportChecklist, getManagedUsers } from "@/lib/data";

export default async function AdminPage() {
  await requireAdminUser();
  const [summary, users] = await Promise.all([getAdminSummary(), getManagedUsers()]);
  const checklist = getImportChecklist();

  return (
    <section className="stack">
      <div className="panel">
        <span className="eyebrow">Painel admin</span>
        <h1 className="section-title">Operacao do bolao</h1>
        <p className="lead">
          O admin importa selecoes, grupos e jogos uma vez, depois acompanha participacao e informa os
          resultados oficiais ao fim de cada partida.
        </p>
      </div>

      <div className="grid-4">
        <div className="card">
          <div className="metric">
            <small>Participantes ativos</small>
            <strong>{summary.participants}</strong>
            <span className="muted">Usuarios com acesso liberado.</span>
          </div>
        </div>
        <div className="card">
          <div className="metric">
            <small>Jogos importados</small>
            <strong>{summary.totalMatches}</strong>
            <span className="muted">Tabela completa: 72 jogos de grupos e 32 do mata-mata.</span>
          </div>
        </div>
        <div className="card">
          <div className="metric">
            <small>Jogos finalizados</small>
            <strong>{summary.finishedMatches}</strong>
            <span className="muted">Prontos para reprocessar ranking.</span>
          </div>
        </div>
        <div className="card">
          <div className="metric">
            <small>Palpites enviados</small>
            <strong>{summary.predictions}</strong>
            <span className="muted">Base para acompanhar engajamento.</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Checklist de importacao</h2>
              <p className="muted">Fluxo recomendado para a carga inicial da Copa.</p>
            </div>
            <div className="admin-user-actions">
              <form action={syncOfficialSeedsAction}>
                <button className="button button-primary" type="submit">
                  Sincronizar tabela oficial
                </button>
              </form>
              <form action={syncOfficialResultsAction}>
                <button className="button button-secondary" type="submit">
                  Buscar resultados oficiais
                </button>
              </form>
            </div>
          </div>
          <div className="admin-list">
            {checklist.map((item) => (
              <div className="admin-item" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <div className="muted">{item.description}</div>
                </div>
                <span className={`status-pill ${item.statusClass}`}>{item.statusLabel}</span>
              </div>
            ))}
          </div>
        </div>

        <AdminUserManager users={users} />
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Arquivos esperados para seed</h2>
            <p className="muted">Esses arquivos ficam versionados no projeto e podem ser importados uma vez.</p>
          </div>
        </div>
        <div className="tag-list">
          <span className="tag">seed/groups.json</span>
          <span className="tag">seed/teams.json</span>
          <span className="tag">seed/matches.json</span>
          <span className="tag">docker/postgres/init</span>
          <span className="tag">README.md</span>
        </div>
      </div>
    </section>
  );
}
