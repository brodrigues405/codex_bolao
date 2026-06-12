import Image from "next/image";
import { Trophy, Shield, TimerReset } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    if (user.mustChangePassword) {
      redirect("/primeiro-acesso");
    }

    redirect(user.role === "admin" ? "/admin" : "/");
  }

  return (
    <section className="grid-2 login-grid">
      <div className="panel login-hero">
        <div className="login-hero-copy">
          <span className="eyebrow">Copa 2026</span>
          <h1 className="section-title">Entre e acompanhe o bolao jogo a jogo.</h1>
        </div>

        <div className="login-hero-art" aria-hidden="true">
          <div className="hero-orb hero-orb-left" />
          <div className="hero-orb hero-orb-right" />
          <div className="hero-poster">
            <div className="hero-poster-top">
              <span className="hero-chip">Mexico</span>
              <span className="hero-chip">Canada</span>
              <span className="hero-chip">Estados Unidos</span>
            </div>

            <div className="hero-cup">
              <div className="hero-ball" />
              <div className="hero-cup-ring" />
            </div>

            <div className="hero-badges">
              <div className="hero-badge">
                <Trophy size={18} />
                <span>Ranking em tempo real</span>
              </div>
              <div className="hero-badge">
                <Shield size={18} />
                <span>Palpites individuais</span>
              </div>
              <div className="hero-badge">
                <TimerReset size={18} />
                <span>Trava por horario oficial</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card login-card">
        <div className="login-payment-card">
          <div className="login-payment-copy">
            <span className="eyebrow">Entrar no bolao</span>
            <strong>Participe com R$ 10,00</strong>
            <p className="muted">
              Faça a transferencia pelo QR Code. Assim que o pagamento cair, o cadastro e os dados de acesso serão enviados.
            </p>
          </div>
          <div className="login-payment-qr">
            <Image
              alt="QR Code para pagamento da entrada do bolao"
              className="login-payment-qr-image"
              height={176}
              priority
              src="/qrcode-andre.png"
              width={176}
            />
          </div>
        </div>

        <div className="login-card-copy">
          <span className="eyebrow">Login</span>
          <h2 className="section-title">Acessar conta</h2>
        </div>
        <LoginForm />
      </div>
    </section>
  );
}
