import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { PixPaymentCard } from "@/components/pix-payment-card";
import { getSessionUser } from "@/lib/auth";
import { PIX_COPY_AND_PASTE_CODE, PIX_ENTRY_AMOUNT_LABEL } from "@/lib/payment";

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
          <p className="lead login-hero-lead">
            Ranking, agenda e palpites em uma experiencia pensada para acompanhar a Copa pelo celular sem perder contexto.
          </p>
        </div>

        <div className="login-hero-art" aria-hidden="true">
          <div className="hero-orb hero-orb-left" />
          <div className="hero-orb hero-orb-right" />
          <div className="hero-image-frame">
            <Image
              alt="Bola dourada em campo iluminado com atmosfera de estadio"
              className="hero-image"
              height={1536}
              priority
              src="/login-hero-stadium.png"
              width={1024}
            />
          </div>
        </div>
      </div>

      <div className="card login-card">
        <PixPaymentCard amountLabel={PIX_ENTRY_AMOUNT_LABEL} code={PIX_COPY_AND_PASTE_CODE} imageSrc="/qrcode-andre.png" />

        <div className="login-card-copy">
          <span className="eyebrow">Login</span>
          <h2 className="section-title">Acessar conta</h2>
        </div>
        <LoginForm />
      </div>
    </section>
  );
}
