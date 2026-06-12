"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  changeOwnPassword,
  ensureParticipantPasswordPolicy,
  hashPassword,
  loginWithPassword,
  logout,
  requireAdminUser,
  requireReadySessionUser,
  requireSessionUser
} from "@/lib/auth";
import { query } from "@/lib/db";
import { syncOfficialSeeds } from "@/lib/official-seeds";

function revalidateAppViews() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/palpites");
  revalidatePath("/ranking");
  revalidatePath("/primeiro-acesso");
}

export async function loginAction(
  _previousState: { error: string },
  formData: FormData
) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Preencha usuario e senha." };
  }

  const result = await loginWithPassword(username, password);

  if (!result.ok) {
    return { error: result.message };
  }

  if (result.user.mustChangePassword) {
    redirect("/primeiro-acesso");
  }

  redirect(result.user.role === "admin" ? "/admin" : "/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function syncOfficialSeedsAction() {
  await requireAdminUser();
  await syncOfficialSeeds();

  revalidateAppViews();
}

export async function createParticipantAction(
  _previousState: { error: string; success: string },
  formData: FormData
) {
  await requireAdminUser();
  await ensureParticipantPasswordPolicy();

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !username || !password) {
    return { error: "Preencha nome, usuario e senha temporaria.", success: "" };
  }

  if (password.length < 4) {
    return { error: "A senha temporaria precisa ter pelo menos 4 caracteres.", success: "" };
  }

  const existingUser = await query<{ id: string }>(
    `
      select id
      from app_users
      where lower(username) = $1
      limit 1
    `,
    [username]
  );

  if (existingUser.rows[0]) {
    return { error: "Ja existe um usuario com esse login.", success: "" };
  }

  await query(
    `
      insert into app_users (name, username, password_hash, role, is_active, must_change_password)
      values ($1, $2, $3, 'participant', true, true)
    `,
    [name, username, hashPassword(password)]
  );

  revalidateAppViews();

  return { error: "", success: `Participante ${name} cadastrado com sucesso.` };
}

export async function toggleUserStatusAction(formData: FormData) {
  await requireAdminUser();

  const userId = String(formData.get("userId") ?? "");
  const nextStatusRaw = String(formData.get("nextStatus") ?? "");
  const nextStatus = nextStatusRaw === "true";

  if (!userId || !nextStatusRaw) {
    return;
  }

  const result = await query<{ role: "admin" | "participant" }>(
    `
      select role
      from app_users
      where id = $1
      limit 1
    `,
    [userId]
  );

  const targetUser = result.rows[0];

  if (!targetUser || targetUser.role === "admin") {
    return;
  }

  await query(
    `
      update app_users
      set is_active = $2
      where id = $1
    `,
    [userId, nextStatus]
  );

  revalidateAppViews();
}

export async function deleteUserAction(formData: FormData) {
  await requireAdminUser();

  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return;
  }

  const result = await query<{ role: "admin" | "participant"; prediction_count: number }>(
    `
      select users.role, count(predictions.id)::int as prediction_count
      from app_users as users
      left join predictions on predictions.user_id = users.id
      where users.id = $1
      group by users.role
      limit 1
    `,
    [userId]
  );

  const targetUser = result.rows[0];

  if (!targetUser || targetUser.role === "admin" || targetUser.prediction_count > 0) {
    return;
  }

  await query("delete from app_users where id = $1", [userId]);

  revalidateAppViews();
}

export async function changeOwnPasswordAction(
  _previousState: { error: string; success: string },
  formData: FormData
) {
  const user = await requireSessionUser();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    return { error: "Preencha a nova senha e a confirmacao.", success: "" };
  }

  if (password.length < 4) {
    return { error: "A nova senha precisa ter pelo menos 4 caracteres.", success: "" };
  }

  if (password !== confirmPassword) {
    return { error: "A confirmacao da senha nao confere.", success: "" };
  }

  await changeOwnPassword(user.id, password);
  revalidateAppViews();

  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}

export async function savePredictionAction(
  _previousState: { error: string; success: string },
  formData: FormData
) {
  const user = await requireReadySessionUser();
  const matchId = String(formData.get("matchId") ?? "");
  const homeScoreRaw = String(formData.get("homeScore") ?? "");
  const awayScoreRaw = String(formData.get("awayScore") ?? "");

  if (!matchId || homeScoreRaw === "" || awayScoreRaw === "") {
    return { error: "Preencha os dois placares.", success: "" };
  }

  const homeScore = Number(homeScoreRaw);
  const awayScore = Number(awayScoreRaw);

  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    return { error: "Use apenas numeros inteiros iguais ou maiores que zero.", success: "" };
  }

  const matchResult = await query<{
    id: string;
    status: "scheduled" | "in_progress" | "finished";
    kickoff_at_utc: string;
  }>(
    `
      select id, status, kickoff_at_utc::text
      from matches
      where id = $1
      limit 1
    `,
    [matchId]
  );

  const match = matchResult.rows[0];

  if (!match) {
    return { error: "Jogo nao encontrado.", success: "" };
  }

  if (match.status !== "scheduled" || new Date(match.kickoff_at_utc).getTime() <= Date.now()) {
    return { error: "Este jogo ja foi bloqueado para palpites.", success: "" };
  }

  await query(
    `
      insert into predictions (user_id, match_id, predicted_home_score, predicted_away_score, points_awarded)
      values ($1, $2, $3, $4, 0)
      on conflict (user_id, match_id) do update set
        predicted_home_score = excluded.predicted_home_score,
        predicted_away_score = excluded.predicted_away_score,
        updated_at = timezone('utc', now())
    `,
    [user.id, matchId, homeScore, awayScore]
  );

  revalidateAppViews();

  return { error: "", success: "Palpite salvo com sucesso." };
}
