"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
};

export function WorkspaceNavbar({
  onSearchChange,
  searchQuery = "",
}: WorkspaceNavbarProps) {
  const { loading, signOut, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = useMemo(
    () => user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email,
    [user],
  );
  const avatarUrl = user?.user_metadata.avatar_url ?? user?.user_metadata.picture;
  const initials = getInitials(displayName);

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
        <a
          href="/workspace"
          aria-label="MUSIC workspace"
          className="group inline-flex h-11 items-center gap-3 rounded-full border border-white/15 bg-white/[0.07] px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition hover:border-white/25 hover:bg-white/[0.1]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-[11px] font-semibold tracking-[-0.02em] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
            M
          </span>
          <span className="hidden text-xs font-semibold tracking-[0.28em] text-white/80 sm:block">
            MUSIC
          </span>
        </a>

        <div className="flex justify-center">
          <label className="relative block w-full max-w-[520px]">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
              <Search className="h-4 w-4" aria-hidden="true" />
            </span>
            <input
              type="search"
              aria-label="Search"
              placeholder="Search by title"
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
                  alt={displayName ? `${displayName} profile` : "User profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white/80">
                  {initials}
                </span>
              )}
            </span>
            <span className="hidden max-w-[120px] truncate text-xs font-medium text-white/72 sm:block">
              {loading ? "Loading" : displayName}
            </span>
          </button>

          <div className="pointer-events-none absolute right-0 top-[calc(100%+10px)] w-44 translate-y-1 opacity-0 transition duration-150 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_55px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex h-10 w-full items-center justify-center rounded-xl text-xs font-semibold text-white/78 transition hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
