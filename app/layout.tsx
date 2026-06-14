import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { MainNav } from "@/components/main-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolao Copa 2026",
  description: "Bolao corporativo simples, moderno e pronto para Docker, Vercel e Supabase."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <header className="site-header">
            <div className="brand">
              <strong>Bolao Copa 2026</strong>
              <span className="brand-subtitle">Palpites, agenda e ranking em um so lugar</span>
            </div>
            <MainNav user={user} />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
