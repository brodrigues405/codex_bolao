import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

const SESSION_COOKIE = "bolao_session";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: "admin" | "participant";
}

interface AuthRow extends SessionUser, Record<string, unknown> {
  password_hash: string;
  is_active: boolean;
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function encodeSession(user: SessionUser) {
  return Buffer.from(JSON.stringify(user), "utf-8").toString("base64url");
}

function decodeSession(value: string): SessionUser | null {
  try {
    const raw = Buffer.from(value, "base64url").toString("utf-8");
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function loginWithPassword(username: string, password: string) {
  const result = await query<AuthRow>(
    `
      select id, name, username, role, password_hash, is_active
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

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  });

  return { ok: true as const, user };
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

export async function requireAdminUser() {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}
