"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginWithPassword, logout, requireAdminUser, requireSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { syncOfficialSeeds } from "@/lib/official-seeds";

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

  redirect(result.user.role === "admin" ? "/admin" : "/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function syncOfficialSeedsAction() {
  await requireAdminUser();
  await syncOfficialSeeds();

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/palpites");
  revalidatePath("/ranking");
}

export async function savePredictionAction(
  _previousState: { error: string; success: string },
  formData: FormData
) {
  const user = await requireSessionUser();
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

  revalidatePath("/palpites");
  revalidatePath("/dashboard");
  revalidatePath("/ranking");

  return { error: "", success: "Palpite salvo com sucesso." };
}
