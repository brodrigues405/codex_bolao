"use client";

import { useState } from "react";

interface HomeHubTabsProps {
  hasParticipantView: boolean;
  participantContent?: React.ReactNode;
  publicContent: React.ReactNode;
}

export function HomeHubTabs({ hasParticipantView, participantContent, publicContent }: HomeHubTabsProps) {
  const [activeTab, setActiveTab] = useState<"public" | "participant">("public");

  return (
    <div className="stack">
      {hasParticipantView ? (
        <div className="prediction-tabs home-hub-tabs" aria-label="Alternar visoes da home">
          <button
            className="prediction-tab"
            data-active={activeTab === "public"}
            onClick={() => setActiveTab("public")}
            type="button"
          >
            <span>Dados do bolao</span>
          </button>
          <button
            className="prediction-tab"
            data-active={activeTab === "participant"}
            onClick={() => setActiveTab("participant")}
            type="button"
          >
            <span>Dados do participante</span>
          </button>
        </div>
      ) : null}

      {activeTab === "public" || !hasParticipantView ? publicContent : participantContent}
    </div>
  );
}
