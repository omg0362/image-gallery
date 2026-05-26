"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseBrowserClient, supabase } from "@/lib/supabase/client";

type AuthContextValue = {
  credits: number | null;
  session: Session | null;
  user: User | null;
  loading: boolean;
  refreshCredits: () => Promise<number | null>;
  setCredits: (credits: number | null) => void;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    const rawSession = window.localStorage.getItem(
      `sb-${projectRef}-auth-token`,
    );

    if (!rawSession) {
      return null;
    }

    const session = JSON.parse(rawSession) as Partial<Session>;

    if (
      typeof session.access_token !== "string" ||
      typeof session.refresh_token !== "string" ||
      typeof session.expires_at !== "number" ||
      typeof session.user !== "object" ||
      session.user === null
    ) {
      return null;
    }

    return session as Session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCredits = useCallback(async (accessToken: string) => {
    const response = await fetch("/api/credits", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = (await response.json().catch(() => null)) as
      | { credits?: unknown }
      | null;

    if (!response.ok || typeof data?.credits !== "number") {
      setCredits(null);
      return null;
    }

    setCredits(data.credits);
    return data.credits;
  }, []);

  const refreshCredits = useCallback(async () => {
    if (!session?.access_token) {
      setCredits(null);
      return null;
    }

    return fetchCredits(session.access_token);
  }, [fetchCredits, session]);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      if (!supabase) {
        return;
      }

      const storedSession = getStoredSession();

      if (storedSession && !cancelled) {
        setSession(storedSession);
      }

      try {
        const { data } = await supabase.auth.getSession();

        if (cancelled) return;

        setSession(data.session);
        if (!data.session) {
          setCredits(null);
        }
      } catch {
        if (cancelled) return;

        setSession(null);
        setCredits(null);
      }
    }

    const initialSyncTimer = window.setTimeout(() => {
      void syncSession();
    }, 0);

    if (!supabase) {
      return () => {
        cancelled = true;
        window.clearTimeout(initialSyncTimer);
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setCredits(null);
      }
      setLoading(false);
    });

    function handlePageShow() {
      window.setTimeout(() => {
        void syncSession();
      }, 0);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        window.setTimeout(() => {
          void syncSession();
        }, 0);
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearTimeout(initialSyncTimer);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      void fetchCredits(session.access_token);
    }, 0);

    return () => {
      window.clearTimeout(refreshTimer);
    };
  }, [fetchCredits, session?.access_token]);

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    const client = getSupabaseBrowserClient();
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo ?? `${window.location.origin}/workspace`,
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      credits,
      session,
      user: session?.user ?? null,
      loading,
      refreshCredits,
      setCredits,
      signInWithGoogle,
      signOut,
    }),
    [credits, loading, refreshCredits, session, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
