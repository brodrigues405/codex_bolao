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
    <form action={action} className="grid-3">
      <input name="matchId" type="hidden" value={matchId} />

      <label>
        <div className="muted">{homeTeam}</div>
        <input
          className="input"
          defaultValue={homeScore ?? ""}
          disabled={!canEdit || isPending}
          inputMode="numeric"
          min="0"
          name="homeScore"
          type="number"
        />
      </label>

      <label>
        <div className="muted">{awayTeam}</div>
        <input
          className="input"
          defaultValue={awayScore ?? ""}
          disabled={!canEdit || isPending}
          inputMode="numeric"
          min="0"
          name="awayScore"
          type="number"
        />
      </label>

      <div className="card">
        <div className="metric">
          <small>Status do palpite</small>
          <strong>{hasPrediction ? "Salvo" : "Pendente"}</strong>
          <span className="muted">
            {canEdit ? "Edicao liberada ate o horario de inicio." : "A partida ja foi bloqueada ou finalizada."}
          </span>
          {canEdit ? (
            <button className="button button-primary" disabled={isPending} type="submit">
              {isPending ? "Salvando..." : hasPrediction ? "Atualizar palpite" : "Salvar palpite"}
            </button>
          ) : null}
          {state.error ? <span className="danger-text">{state.error}</span> : null}
          {state.success ? <span className="success-text">{state.success}</span> : null}
        </div>
      </div>
    </form>
  );
}
