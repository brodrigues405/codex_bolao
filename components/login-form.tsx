"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

const initialState = {
  error: ""
};

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="form-grid login-form-shell">
      <label>
        <div className="muted">Usuario</div>
        <input
          autoCapitalize="none"
          autoComplete="username"
          className="input"
          name="username"
          placeholder="ex.: maria.silva"
        />
      </label>
      <label>
        <div className="muted">Senha</div>
        <input
          autoComplete="current-password"
          className="input"
          name="password"
          placeholder="Sua senha"
          type="password"
        />
      </label>
      <button className="button button-primary" disabled={isPending} type="submit">
        {isPending ? "Entrando..." : "Entrar"}
      </button>
      {state.error ? <div className="banner">{state.error}</div> : null}
    </form>
  );
}
