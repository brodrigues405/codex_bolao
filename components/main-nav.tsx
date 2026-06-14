"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";

const links: Array<{ href: Route; label: string }> = [
  { href: "/", label: "Inicio" },
  { href: "/login", label: "Login" },
  { href: "/primeiro-acesso", label: "Trocar senha" },
  { href: "/palpites", label: "Palpites" },
  { href: "/ranking", label: "Ranking" },
  { href: "/admin", label: "Admin" }
];

export function MainNav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const visibleLinks = links.filter((link) => {
    if (link.href === "/login") return !user;
    if (link.href === "/primeiro-acesso") return Boolean(user?.mustChangePassword);
    if (user?.mustChangePassword) return link.href === "/";
    if (link.href === "/admin") return user?.role === "admin";
    if (link.href === "/palpites" || link.href === "/ranking") {
      return Boolean(user);
    }
    return true;
  });

  return (
    <nav className="site-nav" aria-label="Navegacao principal">
      <div className="site-nav-links">
        {visibleLinks.map((link) => (
          <Link
            className="nav-link"
            data-active={pathname === link.href}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="site-nav-actions">
        {user ? <span className="nav-user-pill">{user.name}</span> : null}
        {user ? (
          <form action={logoutAction}>
            <button className="button button-secondary nav-logout-button" type="submit">
              Sair
            </button>
          </form>
        ) : null}
      </div>
    </nav>
  );
}
