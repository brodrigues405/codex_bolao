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

  useEffect(() => {
    setHomeValue(homeScore?.toString() ?? "");
    setAwayValue(awayScore?.toString() ?? "");
  }, [awayScore, homeScore]);

  useEffect(() => {
    setJoinGeneralLeague(userLeagueOptIn);
  }, [userLeagueOptIn]);

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

      {canEdit && !isFilled ? <span className="muted">Preencha os dois placares para habilitar o salvamento.</span> : null}
      {canEdit && isFilled && (!isValidScore(homeValue) || !isValidScore(awayValue)) ? (
        <span className="danger-text">Use apenas numeros inteiros de 0 a 99.</span>
      ) : null}
      {matchingPredictionGroup ? (
        <div className="banner prediction-peer-banner">
          Esse palpite ja foi escolhido por {matchingPredictionGroup.names.join(", ")}.
        </div>
      ) : null}

      {groupedPeerPredictions.length > 0 ? (
        <div className="prediction-peer-section">
          <div className="prediction-peer-header">
            <strong>Palpites dos colegas</strong>
            <span className="muted">Veja os placares mais repetidos e tente se diferenciar se quiser.</span>
          </div>
          <div className="prediction-peer-list">
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
      ) : null}
      {state.error ? <span className="danger-text">{state.error}</span> : null}
      {state.success ? <span className="success-text">{state.success}</span> : null}
    </form>
  );
}
