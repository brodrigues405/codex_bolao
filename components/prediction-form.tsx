"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { savePredictionAction } from "@/app/actions";
import type { PeerPrediction } from "@/lib/types";

interface PredictionFormProps {
  awayScore: number | null;
  awayTeam: string;
  canEdit: boolean;
  homeScore: number | null;
  homeTeam: string;
  isLaunchMatch?: boolean;
  matchId: string;
  peerPredictions: PeerPrediction[];
  userLeagueOptIn?: boolean;
}

const initialState = {
  error: "",
  success: ""
};

export function PredictionForm({
  awayScore,
  awayTeam,
  canEdit,
  homeScore,
  homeTeam,
  isLaunchMatch = false,
  matchId,
  peerPredictions,
  userLeagueOptIn = false
}: PredictionFormProps) {
  const [state, action, isPending] = useActionState(savePredictionAction, initialState);
  const hasPrediction = homeScore !== null && awayScore !== null;
  const [homeValue, setHomeValue] = useState(homeScore?.toString() ?? "");
  const [awayValue, setAwayValue] = useState(awayScore?.toString() ?? "");
  const [joinGeneralLeague, setJoinGeneralLeague] = useState(userLeagueOptIn);
  const [isPeerModalOpen, setIsPeerModalOpen] = useState(false);

  useEffect(() => {
    setHomeValue(homeScore?.toString() ?? "");
    setAwayValue(awayScore?.toString() ?? "");
  }, [awayScore, homeScore]);

  useEffect(() => {
    setJoinGeneralLeague(userLeagueOptIn);
  }, [userLeagueOptIn]);

  useEffect(() => {
    if (!isPeerModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPeerModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPeerModalOpen]);

  const isFilled = homeValue !== "" && awayValue !== "";
  const isValidScore = (value: string) => /^\d{1,2}$/.test(value);
  const canSubmit = canEdit && isFilled && isValidScore(homeValue) && isValidScore(awayValue) && !isPending;
  const currentScoreline = isFilled && isValidScore(homeValue) && isValidScore(awayValue) ? `${homeValue}x${awayValue}` : null;
  const groupedPeerPredictions = useMemo(() => {
    const groups = new Map<string, { scoreline: string; names: string[] }>();

    for (const prediction of peerPredictions) {
      const scoreline = `${prediction.homeScore}x${prediction.awayScore}`;
      const existing = groups.get(scoreline);

      if (existing) {
        existing.names.push(prediction.name);
        continue;
      }

      groups.set(scoreline, {
        scoreline,
        names: [prediction.name]
      });
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        names: group.names.sort((a, b) => a.localeCompare(b, "pt-BR"))
      }))
      .sort((a, b) => {
        if (b.names.length !== a.names.length) return b.names.length - a.names.length;
        return a.scoreline.localeCompare(b.scoreline, "pt-BR");
      });
  }, [peerPredictions]);
  const matchingPredictionGroup = currentScoreline
    ? groupedPeerPredictions.find((group) => group.scoreline === currentScoreline)
    : undefined;

  return (
    <form action={action} className="prediction-form">
      <input name="matchId" type="hidden" value={matchId} />
      {isLaunchMatch ? (
        <input name="joinGeneralLeague" type="hidden" value={joinGeneralLeague ? "true" : "false"} />
      ) : null}

      <div className="prediction-score-inputs">
        <label className="score-field">
          <span>{homeTeam}</span>
          <input
            className="input score-input"
            disabled={!canEdit || isPending}
            inputMode="numeric"
            min="0"
            max="99"
            name="homeScore"
            onChange={(event) => setHomeValue(event.target.value.replace(/\D/g, "").slice(0, 2))}
            pattern="\d{1,2}"
            value={homeValue}
            type="number"
          />
        </label>

        <div className="score-versus">x</div>

        <label className="score-field">
          <span>{awayTeam}</span>
          <input
            className="input score-input"
            disabled={!canEdit || isPending}
            inputMode="numeric"
            min="0"
            max="99"
            name="awayScore"
            onChange={(event) => setAwayValue(event.target.value.replace(/\D/g, "").slice(0, 2))}
            pattern="\d{1,2}"
            value={awayValue}
            type="number"
          />
        </label>
      </div>

      {isLaunchMatch && canEdit ? (
        <label className="prediction-league-optin">
          <input
            checked={joinGeneralLeague}
            disabled={isPending}
            onChange={(event) => setJoinGeneralLeague(event.target.checked)}
            type="checkbox"
          />
          <span>
            Quero entrar tambem na Liga Geral a partir do jogo do Brasil.
          </span>
        </label>
      ) : null}

      <div className="prediction-form-footer">
        <div className="prediction-state">
          <small>Status do palpite</small>
          <strong>{hasPrediction ? "Salvo" : "Pendente"}</strong>
          <span className="muted">
            {canEdit
              ? "Edicao liberada ate o horario de inicio."
              : "Edicao encerrada. Consulte o resultado oficial e os palpites registrados."}
          </span>
        </div>

        {canEdit ? (
          <button className="button button-primary" disabled={!canSubmit} type="submit">
            {isPending
              ? "Salvando..."
              : isLaunchMatch
                ? hasPrediction
                  ? "Atualizar palpite"
                  : "Enviar meu palpite"
                : hasPrediction
                  ? "Atualizar"
                  : "Salvar"}
          </button>
        ) : null}
      </div>

      {canEdit && !isFilled ? (
        <div className="banner prediction-helper-banner">
          Preencha os dois placares para habilitar o salvamento do seu palpite.
        </div>
      ) : null}
      {canEdit && isFilled && (!isValidScore(homeValue) || !isValidScore(awayValue)) ? (
        <div aria-live="assertive" className="banner banner-danger">Use apenas numeros inteiros de 0 a 99.</div>
      ) : null}
      {matchingPredictionGroup ? (
        <div className="banner prediction-peer-banner">
          Esse palpite ja foi escolhido por {matchingPredictionGroup.names.join(", ")}.
        </div>
      ) : null}

      {groupedPeerPredictions.length > 0 ? (
        <>
          <div className="prediction-peer-section">
            <div className="prediction-peer-header">
              <strong>Palpites dos colegas</strong>
              <span className="muted">Veja os placares mais repetidos sem esticar demais o card do jogo.</span>
            </div>
            <div className="prediction-peer-summary">
              <span className="status-pill open">{peerPredictions.length} colega(s)</span>
              <span className="muted">
                {groupedPeerPredictions.length} placar(es) diferente(s) registrado(s) para este jogo.
              </span>
            </div>
            <button
              className="button button-secondary prediction-peer-trigger"
              onClick={() => setIsPeerModalOpen(true)}
              type="button"
            >
              Visualizar palpites dos colegas
            </button>
          </div>

          {isPeerModalOpen ? (
            <div
              aria-labelledby={`peer-modal-title-${matchId}`}
              aria-modal="true"
              className="modal-backdrop"
              onClick={() => setIsPeerModalOpen(false)}
              role="dialog"
            >
              <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <div className="stack modal-title-stack">
                    <span className="eyebrow">Leitura detalhada</span>
                    <h3 className="section-title" id={`peer-modal-title-${matchId}`}>
                      Palpites dos colegas
                    </h3>
                    <p className="muted">
                      Confira os placares registrados para este jogo e use o scroll somente aqui quando precisar.
                    </p>
                  </div>
                  <button
                    aria-label="Fechar palpites dos colegas"
                    className="button button-secondary modal-close"
                    onClick={() => setIsPeerModalOpen(false)}
                    type="button"
                  >
                    Fechar
                  </button>
                </div>

                <div className="prediction-peer-list prediction-peer-list-modal">
                  {groupedPeerPredictions.map((group) => (
                    <div
                      className="prediction-peer-item"
                      data-match={group.scoreline === currentScoreline}
                      key={group.scoreline}
                    >
                      <div className="prediction-peer-score">{group.scoreline}</div>
                      <div className="prediction-peer-meta">
                        <strong>{group.names.length} colega(s)</strong>
                        <span className="muted">{group.names.join(", ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      {state.error ? <div aria-live="assertive" className="banner banner-danger">{state.error}</div> : null}
      {state.success ? <div aria-live="polite" className="banner banner-success">{state.success}</div> : null}
    </form>
  );
}
