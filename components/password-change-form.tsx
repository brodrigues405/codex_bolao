"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction } from "@/app/actions";

const initialState = {
  error: "",
  success: ""
};

export function PasswordChangeForm() {
  const [state, action, isPending] = useActionState(changeOwnPasswordAction, initialState);

  return (
    <form action={action} className="form-grid">
      <label>
        <div className="muted">Nova senha</div>
        <input
          autoComplete="new-password"
          className="input"
          name="password"
          placeholder="Defina sua nova senha"
          type="password"
        />
      </label>
      <label>
        <div className="muted">Confirmar nova senha</div>
        <input
          autoComplete="new-password"
          className="input"
          name="confirmPassword"
          placeholder="Repita a nova senha"
          type="password"
        />
      </label>
      <button className="button button-primary" disabled={isPending} type="submit">
        {isPending ? "Atualizando..." : "Salvar nova senha"}
      </button>
      <div className="muted">
        Use uma senha facil de lembrar para voce, mas dificil de adivinhar por outras pessoas.
      </div>
      {state.error ? <div aria-live="assertive" className="banner banner-danger">{state.error}</div> : null}
      {state.success ? <div aria-live="polite" className="banner banner-success">{state.success}</div> : null}
    </form>
  );
}
