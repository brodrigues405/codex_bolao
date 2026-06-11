import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __bolaoPool: Pool | undefined;
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? "postgresql://bolao:bolao123@db:5432/bolao";
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
