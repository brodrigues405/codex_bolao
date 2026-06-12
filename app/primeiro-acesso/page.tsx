import { redirect } from "next/navigation";
import { PasswordChangeForm } from "@/components/password-change-form";
import { requireSessionUser } from "@/lib/auth";

export default async function PrimeiroAcessoPage() {
  const user = await requireSessionUser();

  if (!user.mustChangePassword) {
    redirect(user.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <section className="grid-2">
      <div className="panel">
        <span className="eyebrow">Primeiro acesso</span>
        <h1 className="section-title">Atualize sua senha</h1>
        <p className="lead">
          O acesso inicial usa uma senha temporaria criada pelo administrador. Antes de continuar no bolao,
          escolha uma senha nova para proteger sua conta.
        </p>
      </div>
      <div className="card">
        <PasswordChangeForm />
      </div>
    </section>
  );
}
