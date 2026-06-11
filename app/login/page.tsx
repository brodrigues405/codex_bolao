import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    redirect(user.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <section className="grid-2">
      <div className="panel">
        <span className="eyebrow">Acesso simples</span>
        <h1 className="section-title">Entrar no bolao</h1>
        <p className="lead">
          Esta versao usa autenticacao local simples para desenvolvimento em Docker. Isso nos deixa
          evoluir rapido agora e migrar para Supabase depois, sem retrabalho na experiencia principal.
        </p>
      </div>
      <div className="card">
        <LoginForm />
      </div>
    </section>
  );
}
