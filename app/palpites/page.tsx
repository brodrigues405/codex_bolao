import { requireReadySessionUser } from "@/lib/auth";
import { PredictionTabs } from "@/components/prediction-tabs";
import { getPredictionBoard } from "@/lib/data";

export default async function PalpitesPage() {
  const user = await requireReadySessionUser();
  const matches = await getPredictionBoard(user.id);

  return (
    <section className="stack">
      <div className="panel">
        <span className="eyebrow">Palpites</span>
        <h1 className="section-title">Editar palpites do usuario</h1>
        <p className="lead">
          Use a aba de jogos disponiveis para preencher palpites antes do inicio. Jogos finalizados ficam separados para consulta.
        </p>
      </div>

      <PredictionTabs matches={matches} />
    </section>
  );
}
