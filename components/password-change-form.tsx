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
        <input className="input" name="password" placeholder="Defina sua nova senha" type="password" />
      </label>
      <label>
        <div className="muted">Confirmar nova senha</div>
        <input className="input" name="confirmPassword" placeholder="Repita a nova senha" type="password" />
      </label>
      <button className="button button-primary" disabled={isPending} type="submit">
        {isPending ? "Atualizando..." : "Salvar nova senha"}
      </button>
      {state.error ? <div className="banner banner-danger">{state.error}</div> : null}
      {state.success ? <div className="banner banner-success">{state.success}</div> : null}
    </form>
  );
}
