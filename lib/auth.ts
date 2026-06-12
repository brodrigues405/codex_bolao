import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

const SESSION_COOKIE = "bolao_session";

declare global {
  // eslint-disable-next-line no-var
  var __bolaoAuthSchemaPromise: Promise<void> | undefined;
}

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: "admin" | "participant";
  mustChangePassword: boolean;
}

interface AuthRow extends Record<string, unknown> {
  id: string;
  name: string;
  username: string;
  role: "admin" | "participant";
  password_hash: string;
  is_active: boolean;
  must_change_password: boolean;
}

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

async function ensureAuthSchema() {
  if (!global.__bolaoAuthSchemaPromise) {
    global.__bolaoAuthSchemaPromise = query(`
      alter table app_users
      add column if not exists must_change_password boolean not null default false;

      alter table app_users
      add column if not exists league_eligible boolean not null default false;

      alter table app_users
      add column if not exists league_opt_in boolean not null default false;

      alter table app_users
      add column if not exists paid boolean not null default false
    `).then(() => undefined);
  }

  return global.__bolaoAuthSchemaPromise;
}

function toSessionUser(user: Pick<AuthRow, "id" | "name" | "username" | "role" | "must_change_password">): SessionUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    mustChangePassword: user.must_change_password
  };
}

function encodeSession(user: SessionUser) {
  return Buffer.from(JSON.stringify(user), "utf-8").toString("base64url");
}

function decodeSession(value: string): SessionUser | null {
  try {
    const raw = Buffer.from(value, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw) as Partial<SessionUser>;

    if (!parsed.id || !parsed.name || !parsed.username || !parsed.role) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name,
      username: parsed.username,
      role: parsed.role,
      mustChangePassword: Boolean(parsed.mustChangePassword)
    };
  } catch {
    return null;
  }
}

export async function setSessionUser(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  });
}

export async function loginWithPassword(username: string, password: string) {
  await ensureAuthSchema();

  const result = await query<AuthRow>(
    `
      select id, name, username, role, password_hash, is_active, must_change_password
      from app_users
      where lower(username) = $1
      limit 1
    `,
    [username.trim().toLowerCase()]
  );

  const user = result.rows[0];

  if (!user || !user.is_active || user.password_hash !== hashPassword(password)) {
    return { ok: false as const, message: "Usuario ou senha invalidos." };
  }

  const sessionUser = toSessionUser(user);
  await setSessionUser(sessionUser);

  return { ok: true as const, user: sessionUser };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  return raw ? decodeSession(raw) : null;
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireReadySessionUser() {
  const user = await requireSessionUser();

  if (user.mustChangePassword) {
    redirect("/primeiro-acesso");
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
}

export async function changeOwnPassword(userId: string, password: string) {
  await ensureAuthSchema();

  const result = await query<AuthRow>(
    `
      update app_users
      set password_hash = $2,
          must_change_password = false
      where id = $1
      returning id, name, username, role, password_hash, is_active, must_change_password
    `,
    [userId, hashPassword(password)]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("Usuario nao encontrado para atualizar senha.");
  }

  const sessionUser = toSessionUser(user);
  await setSessionUser(sessionUser);

  return sessionUser;
}

export async function ensureParticipantPasswordPolicy() {
  await ensureAuthSchema();
}
