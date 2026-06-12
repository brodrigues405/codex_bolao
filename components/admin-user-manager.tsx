"use client";

import { useActionState } from "react";
import { createParticipantAction, deleteUserAction, toggleUserStatusAction } from "@/app/actions";
import type { ManagedUser } from "@/lib/types";

const initialState = {
  error: "",
  success: ""
};

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
            <input className="input" name="name" placeholder="Ex.: Maria Silva" />
          </label>
          <label>
            <div className="muted">Usuario</div>
            <input className="input" name="username" placeholder="Ex.: maria.silva" />
          </label>
          <label>
            <div className="muted">Senha temporaria</div>
            <input className="input" name="password" placeholder="Defina a senha inicial" type="password" />
          </label>
          <button className="button button-primary" disabled={isPending} type="submit">
            {isPending ? "Cadastrando..." : "Cadastrar participante"}
          </button>
        </form>

        {state.error ? <div className="banner banner-danger">{state.error}</div> : null}
        {state.success ? <div className="banner banner-success">{state.success}</div> : null}
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Usuarios gerenciados</h2>
            <p className="muted">Desative acessos e exclua usuarios de teste que ainda nao tenham palpites.</p>
          </div>
        </div>
        <div className="admin-list">
          {users.map((user) => {
            const canManage = user.role !== "admin";

            return (
              <div className="admin-item admin-item-user" key={user.id}>
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
                    <form action={toggleUserStatusAction}>
                      <input name="userId" type="hidden" value={user.id} />
                      <input name="nextStatus" type="hidden" value={user.isActive ? "false" : "true"} />
                      <button className="button button-secondary" type="submit">
                        {user.isActive ? "Desativar" : "Reativar"}
                      </button>
                    </form>
                  ) : null}

                  {canManage && user.predictionCount === 0 ? (
                    <form action={deleteUserAction}>
                      <input name="userId" type="hidden" value={user.id} />
                      <button className="button button-secondary button-danger" type="submit">
                        Excluir
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
