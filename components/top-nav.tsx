"use client";

import { useAuth } from "@/contexts/auth-context";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/#features", label: "FEATURES" },
  { href: "/#pricing", label: "PRICING" },
  { href: "/#cta", label: "CONTACT" },
];

function TopNav() {
  const { loading, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const actionLabel = loading && !user ? "Loading" : user ? "Workspace" : "Get Started";
  const actionHref = user ? "/workspace" : "/auth";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#030303]/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.28em] text-white sm:text-base"
          onClick={() => setMobileMenuOpen(false)}
        >
          MUSIC
        </Link>

        <div className="hidden items-center gap-12 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium tracking-[0.22em] text-white/60 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex justify-end">
          <Link
            href={actionHref}
            className="hidden h-9 items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.06] px-4 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-white hover:text-[#030303] sm:inline-flex"
          >
            {actionLabel}
          </Link>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-white transition-colors hover:bg-white/12 sm:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div className="border-t border-white/[0.08] bg-[#030303]/96 px-4 pb-5 pt-3 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-12 items-center justify-between rounded-[8px] border border-transparent px-3 text-sm font-semibold tracking-[0.18em] text-white/76 transition-colors hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
              >
                {item.label}
                <span className="text-[#FECD00]">/</span>
              </Link>
            ))}
            <Link
              href={actionHref}
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 inline-flex h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#030303] transition-colors hover:bg-white/90"
            >
              {actionLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export { TopNav };
