"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

const initialState = {
  error: ""
};

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="form-grid">
      <label>
        <div className="muted">Usuario</div>
        <input className="input" name="username" placeholder="ex.: maria.silva" />
      </label>
      <label>
        <div className="muted">Senha</div>
        <input className="input" name="password" placeholder="Senha temporaria" type="password" />
      </label>
      <button className="button button-primary" disabled={isPending} type="submit">
        {isPending ? "Entrando..." : "Entrar"}
      </button>
      {state.error ? <div className="banner">{state.error}</div> : null}
      <div className="banner">Credenciais locais: `admin/admin123` ou `lucas.alves/bolao123`.</div>
    </form>
  );
}
