"use client";

import { useState } from "react";
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
        <div className="table">
          {activeTab === "launch" ? (
            <>
              <div className="table-head ranking-table-head ranking-table-head-launch">
                <span>Pos</span>
                <span>Participante</span>
                <span>Pontos</span>
                <span>Exatos</span>
                <span>Resultados</span>
                <span>Liga Geral</span>
              </div>
              {launchLeaderboard.map((entry) => (
                <div className="table-row ranking-table-row ranking-table-row-launch" key={entry.userId}>
                  <strong>{entry.position}</strong>
                  <span>{entry.name}</span>
                  <strong>{entry.points}</strong>
                  <span>{entry.exactHits}</span>
                  <span>{entry.resultHits}</span>
                  <span>{entry.joinedGeneralLeague ? "Entrou" : "So jogo avulso"}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="table-head ranking-table-head">
                <span>Pos</span>
                <span>Participante</span>
                <span>Pontos</span>
                <span>Exatos</span>
                <span>Resultados</span>
              </div>
              {leaderboard.map((entry) => (
                <div className="table-row ranking-table-row" key={entry.userId}>
                  <strong>{entry.position}</strong>
                  <span>{entry.name}</span>
                  <strong>{entry.points}</strong>
                  <span>{entry.exactHits}</span>
                  <span>{entry.resultHits}</span>
                </div>
              ))}
            </>
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
    </div>
  );
}
