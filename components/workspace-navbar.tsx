"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { Coins, Music2, Search, Star, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

function getInitials(name?: string | null) {
  if (!name) return "M";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

type WorkspaceNavbarProps = {
  creditModalOpen?: boolean;
  onCreditModalOpenChange?: (open: boolean) => void;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
};

type CreditPack = "pro" | "ultra";

type CreditPlan = {
  credits: number;
  id: CreditPack;
  name: string;
  price: string;
};

const CREDIT_PLANS: CreditPlan[] = [
  { credits: 100, id: "pro", name: "Pro", price: "$5" },
  { credits: 1100, id: "ultra", name: "Ultra", price: "$50" },
];

function CreditModal({
  accessToken,
  onClose,
}: {
  accessToken?: string;
  onClose: () => void;
}) {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutPack, setCheckoutPack] = useState<CreditPack | null>(null);

  async function handleCheckout(pack: CreditPack) {
    if (!accessToken) {
      setCheckoutError("결제하려면 먼저 로그인해 주세요.");
      return;
    }

    setCheckoutError(null);
    setCheckoutPack(pack);

    try {
      const response = await fetch("/api/checkout/credits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pack }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: unknown; url?: unknown }
        | null;

      if (!response.ok || !data || typeof data.url !== "string") {
        throw new Error("결제를 시작하지 못했습니다.");
      }

      flushSync(() => {
        setCheckoutPack(null);
        onClose();
      });
      window.location.assign(data.url);
    } catch {
      setCheckoutError("결제를 시작하지 못했습니다.");
      setCheckoutPack(null);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="크레딧 충전"
      onMouseDown={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-[8px] border border-white/14 bg-[#171717] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold">크레딧 충전</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="크레딧 충전 창 닫기"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CREDIT_PLANS.map((plan) => (
              <article
                key={plan.name}
                className="relative min-h-[190px] w-full overflow-hidden rounded-[8px] border border-white/12 bg-white p-5 text-[#171717]"
              >
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at center, #FFF991 0%, transparent 70%)
                    `,
                    opacity: 0.6,
                    mixBlendMode: "multiply",
                  }}
                />
                <div className="relative z-10">
                  <h3 className="text-sm font-semibold text-black/70">
                    {plan.name}
                  </h3>
                  <p className="mt-3 text-3xl font-semibold text-black">
                    {plan.price}
                  </p>
                  <p className="mt-2 text-sm text-black/58">
                    {plan.credits.toLocaleString()} 크레딧
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCheckout(plan.id)}
                    disabled={checkoutPack !== null}
                    className="mt-6 flex h-10 w-full items-center justify-center rounded-full bg-black px-4 text-sm font-semibold text-white transition hover:bg-black/82 disabled:cursor-not-allowed disabled:bg-black/45"
                  >
                    {checkoutPack === plan.id ? "결제로 이동 중..." : "결제하기"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {checkoutError ? (
            <p className="mt-4 rounded-[8px] border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {checkoutError}
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function WorkspaceNavbar({
  creditModalOpen,
  onCreditModalOpenChange,
  onSearchChange,
  searchQuery = "",
}: WorkspaceNavbarProps) {
  const { credits, loading, session, signOut, user } = useAuth();
  const [internalCreditModalOpen, setInternalCreditModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isCreditModalOpen = creditModalOpen ?? internalCreditModalOpen;

  const setCreditModalOpen = useCallback((open: boolean) => {
    onCreditModalOpenChange?.(open);
    if (creditModalOpen === undefined) {
      setInternalCreditModalOpen(open);
    }
  }, [creditModalOpen, onCreditModalOpenChange]);

  const displayName = useMemo(
    () => user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email,
    [user],
  );
  const avatarUrl = user?.user_metadata.avatar_url ?? user?.user_metadata.picture;
  const initials = getInitials(displayName);

  useEffect(() => {
    function handlePageShow() {
      setCreditModalOpen(false);
    }

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [setCreditModalOpen]);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-transparent px-4 py-4 sm:px-6">
      <nav className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link
          href="/"
          aria-label="MUSIC 랜딩페이지로 이동"
          className="group inline-flex h-12 items-center gap-3 rounded-full border border-[#FECD00]/18 bg-[#FECD00]/[0.055] px-3.5 pr-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_16px_48px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition hover:border-[#FECD00]/36 hover:bg-[#FECD00]/[0.09] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_18px_56px_rgba(254,205,0,0.08)]"
        >
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#FECD00]/24 bg-[radial-gradient(circle_at_50%_18%,rgba(254,205,0,0.42),rgba(254,205,0,0.1)_42%,rgba(255,255,255,0.06)_100%)] text-[#FECD00] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_0_28px_rgba(254,205,0,0.16)]">
            <span className="absolute inset-x-1 top-1 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <Music2 className="relative h-4 w-4" aria-hidden="true" />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-[11px] font-semibold tracking-[0.3em] text-white/86">
              MUSIC
            </span>
            <span className="mt-1 text-[9px] font-medium tracking-[0.2em] text-[#FECD00]/64">
              STUDIO
            </span>
          </span>
        </Link>

        <div className="flex justify-center">
          <label className="relative block w-full max-w-[520px]">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
              <Search className="h-4 w-4" aria-hidden="true" />
            </span>
            <input
              type="search"
              aria-label="음악 검색"
              placeholder="제목으로 검색"
              value={searchQuery ?? ""}
              onChange={(event) => onSearchChange?.(event.target.value)}
              className="h-12 w-full rounded-full border border-white/14 bg-white/[0.075] px-11 text-sm text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_55px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition placeholder:text-white/38 focus:border-white/28 focus:bg-white/[0.1] focus:ring-2 focus:ring-white/10"
            />
          </label>
        </div>

        <div className="group relative flex justify-end">
          <button
            type="button"
            className="flex h-11 items-center gap-3 rounded-full border border-white/15 bg-white/[0.07] p-1.5 pr-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition hover:border-white/25 hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <span className="relative flex h-8 w-8 overflow-hidden rounded-full border border-white/20 bg-white/10">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName ? `${displayName} 프로필` : "사용자 프로필"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white/80">
                  {initials}
                </span>
              )}
            </span>
            <span className="hidden max-w-[120px] truncate text-xs font-medium text-white/72 sm:block">
              {loading && !user ? "불러오는 중" : displayName}
            </span>
            <span className="hidden h-7 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-2 text-[11px] font-semibold text-white/72 sm:inline-flex">
              <Coins className="h-3 w-3" aria-hidden="true" />
              {typeof credits === "number" ? credits.toLocaleString() : "--"}
            </span>
          </button>

          <div className="pointer-events-none absolute right-0 top-[calc(100%+10px)] w-44 translate-y-1 opacity-0 transition duration-150 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_55px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
              <div className="mb-1 flex h-10 w-full items-center justify-between rounded-xl px-3 text-xs font-semibold text-white/78">
                <span className="inline-flex items-center gap-2">
                  <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                  크레딧
                </span>
                <span>
                  {typeof credits === "number" ? credits.toLocaleString() : "--"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCreditModalOpen(true)}
                className="mb-1 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold text-white/78 transition hover:bg-white/12 hover:text-white"
              >
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                충전하기
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex h-10 w-full items-center justify-center rounded-xl text-xs font-semibold text-white/78 transition hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? "로그아웃 중..." : "로그아웃"}
              </button>
            </div>
          </div>
        </div>
      </nav>
      {isCreditModalOpen ? (
        <CreditModal
          accessToken={session?.access_token}
          onClose={() => setCreditModalOpen(false)}
        />
      ) : null}
    </header>
  );
}
