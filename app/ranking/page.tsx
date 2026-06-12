import { requireReadySessionUser } from "@/lib/auth";
import { getLaunchMatchLeaderboard, getLeaderboard } from "@/lib/data";
import { RankingTabs } from "@/components/ranking-tabs";

export default async function RankingPage() {
  await requireReadySessionUser();
  const [leaderboard, launchLeaderboard] = await Promise.all([getLeaderboard(), getLaunchMatchLeaderboard()]);

  return (
    <section className="stack">
      <div className="panel">
        <span className="eyebrow">Ranking</span>
        <h1 className="section-title">Classificacao do bolao</h1>
        <p className="lead">
          Os pontos sao calculados de forma deterministica: `5` para placar exato, `2` para acertar
          vencedor ou empate e `0` para erro total.
        </p>
      </div>

      <RankingTabs launchLeaderboard={launchLeaderboard} leaderboard={leaderboard} />
    </section>
  );
}
