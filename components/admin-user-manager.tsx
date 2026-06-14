"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import {
  createParticipantAction,
  deleteUserAction,
  resetUserPasswordAction,
  toggleUserPaidAction,
  toggleUserStatusAction
} from "@/app/actions";
import type { ManagedUser } from "@/lib/types";

const initialState = {
  error: "",
  success: ""
};

function confirmSubmit(message: string) {
  return (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  };
}

function ManagedUserRow({ user }: { user: ManagedUser }) {
  const canManage = user.role !== "admin";
  const [resetState, resetAction, resetPending] = useActionState(resetUserPasswordAction, initialState);
  const [passwordValue, setPasswordValue] = useState("");

  const confirmStatusToggle = user.isActive
    ? `Desativar o acesso de ${user.name}? Ele nao conseguira entrar no bolao ate ser reativado.`
    : `Reativar o acesso de ${user.name}?`;
  const confirmDelete = `Excluir ${user.name} permanentemente? Essa acao so deve ser usada para usuarios sem palpites.`;

  useEffect(() => {
    if (resetState.success) {
      setPasswordValue("");
    }
  }, [resetState.success]);

  return (
    <div className="admin-item admin-item-user">
      <div className="admin-user-main">
        <div>
          <strong>{user.name}</strong>
          <div className="muted">
            {user.username} - {user.role === "admin" ? "Administrador" : "Participante"}
          </div>
          <div className="muted">Palpites enviados: {user.predictionCount}</div>
        </div>

        <div className="admin-user-actions">
          <span className={`status-pill ${user.isActive ? "open" : "locked"}`}>
            {user.isActive ? "ativo" : "inativo"}
          </span>

          {canManage ? (
            <form
              action={toggleUserPaidAction}
              onSubmit={confirmSubmit(
                user.paid
                  ? `Remover a marcacao de pagamento de ${user.name}?`
                  : `Confirmar ${user.name} como participante pago?`
              )}
            >
              <input name="userId" type="hidden" value={user.id} />
              <input name="nextPaid" type="hidden" value={user.paid ? "false" : "true"} />
              <button
                aria-pressed={user.paid}
                className={`payment-toggle ${user.paid ? "is-paid" : ""}`}
                type="submit"
              >
                <span className="payment-toggle-box" aria-hidden="true">
                  {user.paid ? "OK" : ""}
                </span>
                <span>{user.paid ? "Pago" : "Marcar pago"}</span>
              </button>
            </form>
          ) : (
            <span className={`payment-badge ${user.paid ? "is-paid" : ""}`}>
              {user.paid ? "Pago" : "Sem cobranca"}
            </span>
          )}

          {canManage ? (
            <form action={toggleUserStatusAction} onSubmit={confirmSubmit(confirmStatusToggle)}>
              <input name="userId" type="hidden" value={user.id} />
              <input name="nextStatus" type="hidden" value={user.isActive ? "false" : "true"} />
              <button className="button button-secondary" type="submit">
                {user.isActive ? "Desativar" : "Reativar"}
              </button>
            </form>
          ) : null}

          {canManage && user.predictionCount === 0 ? (
            <form action={deleteUserAction} onSubmit={confirmSubmit(confirmDelete)}>
              <input name="userId" type="hidden" value={user.id} />
              <button className="button button-secondary button-danger" type="submit">
                Excluir
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {canManage ? (
        <details className="admin-inline-panel">
          <summary className="admin-inline-summary">Redefinir senha</summary>
          <form
            action={resetAction}
            className="admin-inline-form"
            onSubmit={confirmSubmit(
              `Redefinir a senha temporaria de ${user.name}? No proximo login ele sera obrigado a trocar a senha.`
            )}
          >
            <input name="userId" type="hidden" value={user.id} />
            <label className="admin-inline-field">
              <span className="muted">Nova senha temporaria</span>
              <input
                autoComplete="new-password"
                className="input"
                name="password"
                onChange={(event) => setPasswordValue(event.target.value)}
                placeholder="Defina a nova senha temporaria"
                type="password"
                value={passwordValue}
              />
            </label>
            <button className="button button-secondary" disabled={resetPending} type="submit">
              {resetPending ? "Salvando..." : "Salvar senha temporaria"}
            </button>
            <span className="muted">
              No proximo login, o participante sera enviado para trocar a senha.
            </span>
            {resetState.error ? <div aria-live="assertive" className="banner banner-danger">{resetState.error}</div> : null}
            {resetState.success ? <div aria-live="polite" className="banner banner-success">{resetState.success}</div> : null}
          </form>
        </details>
      ) : null}
    </div>
  );
}

export function AdminUserManager({ users }: { users: ManagedUser[] }) {
  const [state, createAction, isPending] = useActionState(createParticipantAction, initialState);

  return (
    <div className="stack">
      <div className="card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Cadastrar participante</h2>
            <p className="muted">Crie acessos individuais com senha temporaria e comece a liberar o bolao.</p>
          </div>
        </div>

        <form action={createAction} className="admin-user-form">
          <label>
            <div className="muted">Nome</div>
            <input autoComplete="name" className="input" name="name" placeholder="Ex.: Maria Silva" />
          </label>
          <label>
            <div className="muted">Usuario</div>
            <input autoCapitalize="none" className="input" name="username" placeholder="Ex.: maria.silva" />
          </label>
          <label>
            <div className="muted">Senha temporaria</div>
            <input
              autoComplete="new-password"
              className="input"
              name="password"
              placeholder="Defina a senha inicial"
              type="password"
            />
          </label>
          <button className="button button-primary" disabled={isPending} type="submit">
            {isPending ? "Cadastrando..." : "Cadastrar participante"}
          </button>
        </form>

        <div className="admin-form-help muted">
          Usuario e senha temporaria sao enviados pelo administrador. O participante sera direcionado para trocar a
          senha no primeiro acesso.
        </div>

        {state.error ? <div aria-live="assertive" className="banner banner-danger">{state.error}</div> : null}
        {state.success ? <div aria-live="polite" className="banner banner-success">{state.success}</div> : null}
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Usuarios gerenciados</h2>
            <p className="muted">Desative acessos, marque pagamentos e redefina senhas temporarias quando necessario.</p>
          </div>
        </div>
        <div className="admin-list">
          {users.length > 0 ? (
            users.map((user) => <ManagedUserRow key={user.id} user={user} />)
          ) : (
            <div className="banner">Nenhum usuario encontrado ainda. Cadastre o primeiro participante para comecar.</div>
          )}
        </div>
      </div>
    </div>
  );
}
