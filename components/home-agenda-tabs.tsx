"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Route } from "next";
import type { DecoratedMatch } from "@/lib/types";

interface HomeAgendaTabsProps {
  actionHref: Route;
  actionLabel: string;
  matches: DecoratedMatch[];
}

function FlagBadge({ name, url }: { name: string; url?: string }) {
  if (!url) {
    return <span className="flag-placeholder">A definir</span>;
  }

  return <Image alt={`Bandeira de ${name}`} className="team-flag" height={26} src={url} width={38} />;
}

export function HomeAgendaTabs({ actionHref, actionLabel, matches }: HomeAgendaTabsProps) {
  const now = Date.now();
  const upcomingMatches = matches.filter((match) => new Date(match.kickoffAtUtc).getTime() > now);
  const lockedMatches = matches.filter((match) => match.status === "locked");
  const finishedMatches = matches.filter((match) => match.status === "finished");
  const [activeTab, setActiveTab] = useState(upcomingMatches.length > 0 ? "upcoming" : lockedMatches.length > 0 ? "locked" : "finished");

  const visibleMatches =
    activeTab === "upcoming" ? upcomingMatches : activeTab === "locked" ? lockedMatches : finishedMatches;

  return (
    <div className="stack">
      <div className="prediction-tabs">
        <button
          className="prediction-tab"
          data-active={activeTab === "upcoming"}
          onClick={() => setActiveTab("upcoming")}
          type="button"
        >
          <span>Proximos Jogos</span>
          <small>{upcomingMatches.length}</small>
        </button>
        <button
          className="prediction-tab"
          data-active={activeTab === "locked"}
          onClick={() => setActiveTab("locked")}
          type="button"
        >
          <span>Jogos bloqueados</span>
          <small>{lockedMatches.length}</small>
        </button>
        <button
          className="prediction-tab"
          data-active={activeTab === "finished"}
          onClick={() => setActiveTab("finished")}
          type="button"
        >
          <span>Jogos finalizados</span>
          <small>{finishedMatches.length}</small>
        </button>
      </div>

      {visibleMatches.length === 0 ? (
        <div className="banner">
          {activeTab === "upcoming"
            ? "Nenhum jogo futuro encontrado na agenda."
            : activeTab === "locked"
              ? "Nenhum jogo bloqueado para exibir no momento."
              : "Nenhum jogo finalizado para exibir no momento."}
        </div>
      ) : (
        <div className="stack">
          {visibleMatches.slice(0, 4).map((match) => (
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
              <div>
                <div className="home-agenda-actions">
                  <span className={`status-pill ${match.statusClass}`}>{match.statusLabel}</span>
                  {activeTab === "upcoming" ? (
                    <Link className="home-agenda-link status-pill open" href={actionHref}>
                      {actionLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
              {activeTab === "finished" && match.officialScore ? (
                <div className="home-agenda-result">
                  <small>Resultado oficial</small>
                  <strong>
                    {match.homeTeam} {match.officialScore.homeScore} x {match.officialScore.awayScore} {match.awayTeam}
                  </strong>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
