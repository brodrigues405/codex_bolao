"use client";

import Image from "next/image";
import { useState } from "react";

interface PixPaymentCardProps {
  amountLabel: string;
  code: string;
  imageSrc: string;
}

export function PixPaymentCard({ amountLabel, code, imageSrc }: PixPaymentCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="login-payment-card">
      <div className="login-payment-copy">
        <span className="eyebrow">Entrar no bolao</span>
        <strong>Participe com {amountLabel}</strong>
        <p className="muted">
          Faca a transferencia pelo QR Code ou copie o Pix no celular. Assim que o pagamento cair, o administrador
          entra em contato para liberar o acesso.
        </p>
      </div>

      <div className="login-onboarding-card">
        <strong>Ainda nao tem conta?</strong>
        <ol className="login-onboarding-steps">
          <li>Realize o pagamento da entrada pelo Pix informado abaixo.</li>
          <li>Envie o comprovante para o administrador do bolao.</li>
          <li>Aguarde o contato com usuario, senha temporaria e orientacoes de primeiro acesso.</li>
        </ol>
      </div>

      <div className="login-payment-side">
        <div className="login-payment-qr">
          <Image
            alt="QR Code para pagamento da entrada do bolao"
            className="login-payment-qr-image"
            height={176}
            priority
            src={imageSrc}
            width={176}
          />
        </div>

        <div className="login-payment-code">
          <span className="muted">Pix copia e cola</span>
          <textarea
            aria-label="Codigo Pix copia e cola"
            className="login-payment-code-input"
            readOnly
            rows={4}
            value={code}
          />
          <button className={`button ${copied ? "button-success" : "button-secondary"}`} onClick={handleCopy} type="button">
            {copied ? "Codigo copiado" : "Copiar codigo Pix"}
          </button>
        </div>
      </div>
    </div>
  );
}
