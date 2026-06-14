"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { PredictionForm } from "@/components/prediction-form";
import type { PredictionBoardMatch } from "@/lib/types";

interface PredictionTabsProps {
  matches: PredictionBoardMatch[];
}

interface MatchTab {
  id: string;
  label: string;
  count: number;
}

type StatusTabId = "available" | "locked" | "completed";

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

function getTabId(match: PredictionBoardMatch) {
  if (match.groupName) {
    return `group-${match.groupName.toLowerCase()}`;
  }

  return "knockout";
}

function getTabLabel(match: PredictionBoardMatch) {
  if (match.groupName) {
    return `Grupo ${match.groupName}`;
  }

  return "Mata-mata";
}

export function PredictionTabs({ matches }: PredictionTabsProps) {
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTabId>("available");

  const filteredMatches = useMemo(() => {
    if (activeStatusTab === "available") {
      return matches.filter((match) => match.status === "open");
    }

    if (activeStatusTab === "locked") {
      return matches.filter((match) => match.status === "locked");
    }

    return matches.filter((match) => match.status === "finished");
  }, [activeStatusTab, matches]);

  const tabs = useMemo<MatchTab[]>(() => {
    const groupedTabs = new Map<string, MatchTab>();

    for (const match of filteredMatches) {
      const id = getTabId(match);
      const current = groupedTabs.get(id);

      if (current) {
        current.count += 1;
        continue;
      }

      groupedTabs.set(id, {
        id,
        label: getTabLabel(match),
        count: 1
      });
    }

    return [
      { id: "all", label: "Todos", count: filteredMatches.length },
      ...Array.from(groupedTabs.values()).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
    ];
  }, [filteredMatches]);

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "all");

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("all");
    }
  }, [activeTab, tabs]);

  const visibleMatches = useMemo(() => {
    if (activeTab === "all") {
      return filteredMatches;
    }

    return filteredMatches.filter((match) => getTabId(match) === activeTab);
  }, [activeTab, filteredMatches]);

  return (
    <div className="stack">
      <div className="prediction-tabs-shell">
        <div className="stack">
          <div className="prediction-tabs prediction-tabs-status" aria-label="Filtrar palpites por status">
            <button
              className="prediction-tab"
              data-active={activeStatusTab === "available"}
              onClick={() => setActiveStatusTab("available")}
              type="button"
            >
              <span>Jogos disponiveis</span>
              <small>{matches.filter((match) => match.status === "open").length}</small>
            </button>
            <button
              className="prediction-tab"
              data-active={activeStatusTab === "locked"}
              onClick={() => setActiveStatusTab("locked")}
              type="button"
            >
              <span>Jogos bloqueados</span>
              <small>{matches.filter((match) => match.status === "locked").length}</small>
            </button>
            <button
              className="prediction-tab"
              data-active={activeStatusTab === "completed"}
              onClick={() => setActiveStatusTab("completed")}
              type="button"
            >
              <span>Jogos finalizados</span>
              <small>{matches.filter((match) => match.status === "finished").length}</small>
            </button>
          </div>

          <div className="prediction-tabs prediction-tabs-groups" aria-label="Filtrar palpites por grupo">
            {tabs.map((tab) => (
              <button
                className="prediction-tab"
                data-active={activeTab === tab.id}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <span>{tab.label}</span>
                <small>{tab.count}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      {visibleMatches.length === 0 ? (
        <div className="banner">
          {activeStatusTab === "available"
            ? "Nenhum jogo disponivel para palpitar neste filtro."
            : activeStatusTab === "locked"
              ? "Nenhum jogo bloqueado para consultar neste filtro."
              : "Nenhum jogo finalizado para consultar neste filtro."}
        </div>
      ) : (
        <>
          {visibleMatches.map((match) => (
            <div className="card prediction-card" id={match.isLaunchMatch ? "launch-match" : undefined} key={match.id}>
              <div className="prediction-card-header">
                <div>
                  <div className="prediction-card-badges">
                    <span className="eyebrow">{match.groupName ? `Grupo ${match.groupName}` : match.stageLabel}</span>
                    {match.isLaunchMatch ? <span className="status-pill open">Jogo de estreia do bolao</span> : null}
                  </div>
                  <h2 className="prediction-title">
                    {match.fifaMatchNumber ? `Jogo ${match.fifaMatchNumber}` : match.stageLabel}
                  </h2>
                  <div className="prediction-meta">
                    <span>{formatVenue(match.stadium, match.city)}</span>
                    <strong>{match.kickoffLabel}</strong>
                  </div>
                </div>
                <span className={`status-pill ${match.statusClass}`}>
                  {match.status === "open"
                    ? "Disponivel"
                    : match.status === "locked"
                      ? "Palpite bloqueado"
                      : "Jogo finalizado"}
                </span>
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

              {match.officialScore ? (
                <div className="prediction-official-result">
                  <small>Resultado oficial</small>
                  <strong>
                    {match.homeTeam} {match.officialScore.homeScore} x {match.officialScore.awayScore} {match.awayTeam}
                  </strong>
                </div>
              ) : match.status !== "open" ? (
                <div className="prediction-official-result prediction-official-result-pending">
                  <small>Resultado oficial</small>
                  <strong>Aguardando sincronizacao do placar final.</strong>
                </div>
              ) : null}

              <PredictionForm
                awayScore={match.userPrediction?.awayScore ?? null}
                awayTeam={match.awayTeam}
                canEdit={match.status === "open"}
                homeScore={match.userPrediction?.homeScore ?? null}
                homeTeam={match.homeTeam}
                isLaunchMatch={match.isLaunchMatch}
                matchId={match.id}
                peerPredictions={match.peerPredictions}
                userLeagueOptIn={match.userLeagueOptIn}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
