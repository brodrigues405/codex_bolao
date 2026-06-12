import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __bolaoPool: Pool | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    return databaseUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return "postgresql://bolao:bolao123@db:5432/bolao";
  }

  throw new Error(
    "DATABASE_URL nao definida. Em producao, configure a string de conexao completa do Postgres/Supabase nas variaveis do ambiente."
  );
}

export function getPool() {
  if (!global.__bolaoPool) {
    global.__bolaoPool = new Pool({
      connectionString: getDatabaseUrl()
    });
  }

  return global.__bolaoPool;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
) {
  return getPool().query<T>(text, params);
}
