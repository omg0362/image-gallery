"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M21.805 10.041H21V10H12v4h5.651A5.998 5.998 0 0 1 6 12a6 6 0 0 1 10.243-4.243l2.829-2.829A10 10 0 1 0 22 12c0-.659-.068-1.302-.195-1.959Z"
        fill="#FFC107"
      />
      <path
        d="m3.153 7.345 3.286 2.409A5.997 5.997 0 0 1 12 6c1.53 0 2.921.577 3.979 1.521l2.828-2.828A9.958 9.958 0 0 0 12 2a9.995 9.995 0 0 0-8.847 5.345Z"
        fill="#FF3D00"
      />
      <path
        d="M12 22a9.953 9.953 0 0 0 6.733-2.616l-3.095-2.619A5.955 5.955 0 0 1 12 18a5.997 5.997 0 0 1-5.637-3.973l-3.262 2.514A9.995 9.995 0 0 0 12 22Z"
        fill="#4CAF50"
      />
      <path
        d="M21.805 10.041H21V10H12v4h5.651a6.02 6.02 0 0 1-2.015 2.765l.002-.001 3.095 2.619C18.514 19.582 22 17 22 12c0-.659-.068-1.302-.195-1.959Z"
        fill="#1976D2"
      />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { loading, signInWithGoogle, signOut, user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const displayName =
    user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email;

  useEffect(() => {
    if (!loading && user) {
      router.replace("/workspace");
    }
  }, [loading, router, user]);

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Google sign-in failed. Please try again.",
      );
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await signOut();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Sign-out failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#171717] px-5 py-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.13),transparent_34%),radial-gradient(circle_at_12%_18%,rgba(99,102,241,0.16),transparent_24%),radial-gradient(circle_at_88%_78%,rgba(244,114,182,0.14),transparent_26%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <section className="relative w-full max-w-[420px] rounded-[28px] border border-white/15 bg-white/[0.075] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.46)] backdrop-blur-2xl sm:p-10">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_42%,rgba(255,255,255,0.07))]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <div className="relative">
          <div className="mb-10 text-center">
            <p className="mb-4 text-xs font-medium tracking-[0.34em] text-white/45">
              MUSIC
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {user ? "Signed in" : "Welcome back"}
            </h1>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-white/50">
              {user
                ? `${displayName} 계정으로 로그인되어 있습니다.`
                : "Continue with Google to start shaping your own sound."}
            </p>
          </div>

          {user ? (
            <button
              type="button"
              disabled={loading || submitting}
              onClick={handleSignOut}
              className="group flex h-13 w-full items-center justify-center rounded-full border border-white/15 bg-white text-sm font-semibold text-[#171717] shadow-[0_14px_42px_rgba(255,255,255,0.16)] transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing out..." : "Sign out"}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || submitting}
              onClick={handleGoogleSignIn}
              className="group flex h-13 w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white text-sm font-semibold text-[#171717] shadow-[0_14px_42px_rgba(255,255,255,0.16)] transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {submitting ? "Connecting..." : "Continue with Google"}
            </button>
          )}

          {errorMessage ? (
            <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-xs leading-5 text-red-100">
              {errorMessage}
            </p>
          ) : null}

          <p className="mt-8 text-center text-xs leading-5 text-white/35">
            By continuing, you agree to keep the rhythm moving.
          </p>
        </div>
      </section>
    </main>
  );
}
