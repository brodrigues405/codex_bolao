"use client";

import { useState } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import type { LeaderboardEntry, LaunchMatchLeaderboardEntry } from "@/lib/types";

interface RankingTabsProps {
  leaderboard: LeaderboardEntry[];
  launchLeaderboard: LaunchMatchLeaderboardEntry[];
}

export function RankingTabs({ leaderboard, launchLeaderboard }: RankingTabsProps) {
  const [activeTab, setActiveTab] = useState<"launch" | "general">("launch");

  return (
    <div className="stack">
      <div className="prediction-tabs-shell">
        <div className="prediction-tabs" aria-label="Alternar visoes do ranking">
          <button
            className="prediction-tab"
            data-active={activeTab === "launch"}
            onClick={() => setActiveTab("launch")}
            type="button"
          >
            <span>Ranking do jogo do Brasil</span>
            <small>{launchLeaderboard.length}</small>
          </button>
          <button
            className="prediction-tab"
            data-active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
            type="button"
          >
            <span>Ranking geral</span>
            <small>{leaderboard.length}</small>
          </button>
        </div>
      </div>

      {activeTab === "general" ? (
        <div className="banner">
          A Liga Geral comeca a partir do jogo Brasil x Marrocos. Jogos anteriores nao serao considerados.
        </div>
      ) : (
        <div className="banner">
          Este ranking considera somente os participantes que enviaram palpite para Brasil x Marrocos.
        </div>
      )}

      <div className="card">
        {activeTab === "launch" ? (
          <LeaderboardTable entries={launchLeaderboard} variant="launch" />
        ) : (
          <LeaderboardTable entries={leaderboard} />
        )}
        {(activeTab === "launch" ? launchLeaderboard.length : leaderboard.length) === 0 ? (
          <div className="banner">
            {activeTab === "launch"
              ? "Ainda nao existem palpites registrados para o jogo do Brasil."
              : "Ainda nao existem participantes elegiveis no ranking geral."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
