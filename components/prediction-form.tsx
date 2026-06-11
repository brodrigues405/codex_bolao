"use client";

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

  return (
    <form action={action} className="prediction-form">
      <input name="matchId" type="hidden" value={matchId} />

      <div className="prediction-score-inputs">
        <label className="score-field">
          <span>{homeTeam}</span>
          <input
            className="input score-input"
            defaultValue={homeScore ?? ""}
            disabled={!canEdit || isPending}
            inputMode="numeric"
            min="0"
            name="homeScore"
            placeholder="0"
            type="number"
          />
        </label>

        <div className="score-versus">x</div>

        <label className="score-field">
          <span>{awayTeam}</span>
          <input
            className="input score-input"
            defaultValue={awayScore ?? ""}
            disabled={!canEdit || isPending}
            inputMode="numeric"
            min="0"
            name="awayScore"
            placeholder="0"
            type="number"
          />
        </label>
      </div>

      <div className="prediction-form-footer">
        <div className="prediction-state">
          <small>Status do palpite</small>
          <strong>{hasPrediction ? "Salvo" : "Pendente"}</strong>
          <span className="muted">
            {canEdit ? "Edicao liberada ate o horario de inicio." : "Partida bloqueada ou finalizada."}
          </span>
        </div>

        {canEdit ? (
          <button className="button button-primary" disabled={isPending} type="submit">
            {isPending ? "Salvando..." : hasPrediction ? "Atualizar" : "Salvar"}
          </button>
        ) : null}
      </div>

      {state.error ? <span className="danger-text">{state.error}</span> : null}
      {state.success ? <span className="success-text">{state.success}</span> : null}
    </form>
  );
}
