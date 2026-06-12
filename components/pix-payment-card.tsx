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
        <span className="eyebrow">Entrar no bolão</span>
        <strong>Participe com {amountLabel}</strong>
        <p className="muted">
          Faça a transferência pelo QR Code ou copie o Pix no celular. Assim que o pagamento cair, o cadastro e os
          dados de acesso serão enviados.
        </p>
      </div>

      <div className="login-payment-side">
        <div className="login-payment-qr">
          <Image
            alt="QR Code para pagamento da entrada do bolão"
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
            aria-label="Código Pix copia e cola"
            className="login-payment-code-input"
            readOnly
            rows={4}
            value={code}
          />
          <button className={`button ${copied ? "button-success" : "button-secondary"}`} onClick={handleCopy} type="button">
            {copied ? "Código copiado" : "Copiar código Pix"}
          </button>
        </div>
      </div>
    </div>
  );
}
