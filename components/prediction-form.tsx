"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { savePredictionAction } from "@/app/actions";

interface PredictionFormProps {
  awayScore: number | null;
  awayTeam: string;
  canEdit: boolean;
  homeScore: number | null;
  homeTeam: string;
  matchId: string;
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
  matchId
}: PredictionFormProps) {
  const [state, action, isPending] = useActionState(savePredictionAction, initialState);
  const hasPrediction = homeScore !== null && awayScore !== null;
  const [homeValue, setHomeValue] = useState(homeScore?.toString() ?? "");
  const [awayValue, setAwayValue] = useState(awayScore?.toString() ?? "");

  useEffect(() => {
    setHomeValue(homeScore?.toString() ?? "");
    setAwayValue(awayScore?.toString() ?? "");
  }, [awayScore, homeScore]);

  const isFilled = homeValue !== "" && awayValue !== "";
  const isValidScore = (value: string) => /^\d{1,2}$/.test(value);
  const canSubmit = canEdit && isFilled && isValidScore(homeValue) && isValidScore(awayValue) && !isPending;

  return (
    <form action={action} className="prediction-form">
      <input name="matchId" type="hidden" value={matchId} />

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

      <div className="prediction-form-footer">
        <div className="prediction-state">
          <small>Status do palpite</small>
          <strong>{hasPrediction ? "Salvo" : "Pendente"}</strong>
          <span className="muted">
            {canEdit ? "Edicao liberada ate o horario de inicio." : "Jogo finalizado para envio de palpite."}
          </span>
        </div>

        {canEdit ? (
          <button className="button button-primary" disabled={!canSubmit} type="submit">
            {isPending ? "Salvando..." : hasPrediction ? "Atualizar" : "Salvar"}
          </button>
        ) : null}
      </div>

      {canEdit && !isFilled ? <span className="muted">Preencha os dois placares para habilitar o salvamento.</span> : null}
      {canEdit && isFilled && (!isValidScore(homeValue) || !isValidScore(awayValue)) ? (
        <span className="danger-text">Use apenas numeros inteiros de 0 a 99.</span>
      ) : null}
      {state.error ? <span className="danger-text">{state.error}</span> : null}
      {state.success ? <span className="success-text">{state.success}</span> : null}
    </form>
  );
}
