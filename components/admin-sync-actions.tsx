"use client";

import type { FormEvent } from "react";
import { syncOfficialResultsAction, syncOfficialSeedsAction } from "@/app/actions";

function confirmSubmit(message: string) {
  return (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  };
}

export function AdminSyncActions() {
  return (
    <div className="admin-user-actions">
      <form
        action={syncOfficialSeedsAction}
        onSubmit={confirmSubmit(
          "Sincronizar a tabela oficial agora? Isso pode atualizar jogos existentes e remover partidas antigas fora da base versionada."
        )}
      >
        <button className="button button-primary" type="submit">
          Sincronizar tabela oficial
        </button>
      </form>
      <form
        action={syncOfficialResultsAction}
        onSubmit={confirmSubmit(
          "Buscar resultados oficiais agora? Os placares e status dos jogos serao atualizados com base na API externa."
        )}
      >
        <button className="button button-secondary" type="submit">
          Buscar resultados oficiais
        </button>
      </form>
    </div>
  );
}
