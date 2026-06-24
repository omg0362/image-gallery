"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MusicList, type MusicTrack } from "@/components/musiclist";
import { MusicPlayer } from "@/components/musicplayer";
import {
  PromptInputBox,
  type PromptOptions,
} from "@/components/ui/ai-prompt-box";
import { WorkspaceNavbar } from "@/components/workspace-navbar";
import { useAuth } from "@/contexts/auth-context";

function LoadingLines() {
  const letters = "생성 중".split("");

  return (
    <div className="relative flex h-12 w-fit items-center justify-center overflow-hidden px-2 font-semibold text-white select-none">
      {letters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className="relative z-[2] inline-block opacity-0 animate-[musicLetterAnim_4s_linear_infinite]"
          style={{ animationDelay: `${0.1 + index * 0.105}s` }}
        >
          {letter}
        </span>
      ))}
      <div className="absolute inset-0 z-[1] bg-transparent [mask:repeating-linear-gradient(90deg,transparent_0,transparent_6px,black_7px,black_8px)]">
        <div className="absolute inset-0 animate-[musicTransformAnim_2s_infinite_alternate_cubic-bezier(0.6,0.8,0.5,1),musicOpacityAnim_4s_infinite] [background-image:radial-gradient(circle_at_50%_50%,#ff0_0%,transparent_50%),radial-gradient(circle_at_45%_45%,#f00_0%,transparent_45%),radial-gradient(circle_at_55%_55%,#0ff_0%,transparent_45%),radial-gradient(circle_at_45%_55%,#0f0_0%,transparent_45%),radial-gradient(circle_at_55%_45%,#00f_0%,transparent_45%)] [mask:radial-gradient(circle_at_50%_50%,transparent_0%,transparent_10%,black_25%)]" />
      </div>
      <style>{`
        @keyframes musicTransformAnim {
          0% {
            transform: translate(-55%);
          }
          100% {
            transform: translate(55%);
          }
        }

        @keyframes musicOpacityAnim {
          0%,
          100% {
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          65% {
            opacity: 0;
          }
        }

        @keyframes musicLetterAnim {
          0% {
            opacity: 0;
          }
          5% {
            opacity: 1;
            text-shadow: 0 0 4px #fff;
            transform: scale(1.1) translateY(-2px);
          }
          20% {
            opacity: 0.2;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function StatusMessage({
  errorMessage,
  generating,
}: {
  errorMessage: string | null;
  generating: boolean;
}) {
  if (errorMessage) {
    return (
      <div className="mb-4 flex min-h-12 items-center gap-2 text-sm text-red-100">
        <svg
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-red-300"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M6 6l12 12M18 6 6 18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
        </svg>
        <span className="line-clamp-2">{errorMessage}</span>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="mb-4 flex min-h-12 items-center">
        <LoadingLines />
      </div>
    );
  }

  return <div className="mb-4 min-h-12" aria-hidden="true" />;
}

export function WorkspaceShell() {
  const router = useRouter();
  const { credits, loading, refreshCredits, session, setCredits, user } =
    useAuth();
  const tracksRequestRef = useRef<AbortController | null>(null);
  const tracksRef = useRef<MusicTrack[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState(false);
  const [pauseRequest, setPauseRequest] = useState(0);
  const [playRequest, setPlayRequest] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const currentTrack =
    tracks.find((track) => track.id === selectedTrackId) ?? tracks[0] ?? null;
  const filteredTracks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return tracks;
    }

    return tracks.filter((track) =>
      (track.title ?? track.file_name ?? "")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [searchQuery, tracks]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, router, user]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (!url.searchParams.has("checkout_id")) {
      return;
    }

    url.searchParams.delete("checkout_id");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, []);

  const loadTracks = useCallback(async (accessToken: string) => {
    tracksRequestRef.current?.abort();

    const controller = new AbortController();
    tracksRequestRef.current = controller;

    await Promise.resolve();
    if (controller.signal.aborted) return;

    if (tracksRef.current.length === 0) {
      setLoadingTracks(true);
    }
    setErrorMessage(null);

    let timedOut = false;
    const requestTimeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    try {
      const response = await fetch("/api/music", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        music?: MusicTrack[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error("음악 목록을 불러오지 못했습니다.");
      }

      if (!controller.signal.aborted) {
        tracksRef.current = data.music ?? [];
        setTracks(data.music ?? []);
      }
    } catch {
      if (!controller.signal.aborted || timedOut) {
        setErrorMessage(
          timedOut
            ? "음악 목록 새로고침 시간이 초과되었습니다. 다시 시도해 주세요."
            : "음악 목록을 불러오지 못했습니다.",
        );
      }
    } finally {
      window.clearTimeout(requestTimeout);

      if (tracksRequestRef.current === controller) {
        tracksRequestRef.current = null;
      }

      if (!controller.signal.aborted || timedOut) {
        setLoadingTracks(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      tracksRequestRef.current?.abort();
      tracksRequestRef.current = null;
      return;
    }

    const loadTimer = window.setTimeout(() => {
      void loadTracks(session.access_token);
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
      tracksRequestRef.current?.abort();
      tracksRequestRef.current = null;
      setLoadingTracks(false);
    };
  }, [loadTracks, session?.access_token]);

  useEffect(() => {
    function handlePageHide() {
      tracksRequestRef.current?.abort();
      tracksRequestRef.current = null;
      setLoadingTracks(false);
      setGenerating(false);
    }

    function handlePageShow() {
      setLoadingTracks(false);
      void refreshCredits();

      if (session?.access_token) {
        void loadTracks(session.access_token);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return;
      }

      setLoadingTracks(false);
      void refreshCredits();

      if (session?.access_token) {
        void loadTracks(session.access_token);
      }
    }

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadTracks, refreshCredits, session?.access_token]);

  async function handleRenameTrack(track: MusicTrack) {
    if (!session?.access_token) {
      setErrorMessage("음악 이름을 변경하려면 먼저 로그인해 주세요.");
      return;
    }

    const nextTitle = window.prompt(
      "음악 이름 변경",
      track.title ?? track.file_name ?? "",
    );

    if (!nextTitle?.trim()) return;

    setErrorMessage(null);

    try {
      const response = await fetch("/api/music", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: track.id, title: nextTitle.trim() }),
      });
      const data = (await response.json()) as {
        music?: MusicTrack;
        error?: string;
      };

      if (!response.ok || !data.music) {
        throw new Error("음악 이름을 변경하지 못했습니다.");
      }

      setTracks((currentTracks) =>
        currentTracks.map((currentTrack) =>
          currentTrack.id === data.music?.id ? data.music : currentTrack,
        ),
      );
    } catch {
      setErrorMessage("음악 이름을 변경하지 못했습니다.");
    }
  }

  async function handleDeleteTrack(track: MusicTrack) {
    if (!session?.access_token) {
      setErrorMessage("음악을 삭제하려면 먼저 로그인해 주세요.");
      return;
    }

    const confirmed = window.confirm(
      `"${track.title ?? track.file_name ?? "이 음악"}"을 삭제할까요?`,
    );

    if (!confirmed) return;

    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/music?id=${encodeURIComponent(track.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error("음악을 삭제하지 못했습니다.");
      }

      setTracks((currentTracks) =>
        currentTracks.filter((currentTrack) => currentTrack.id !== track.id),
      );

      if (selectedTrackId === track.id) {
        setSelectedTrackId(null);
      }
    } catch {
      setErrorMessage("음악을 삭제하지 못했습니다.");
    }
  }

  async function handleDownloadTrack(track: MusicTrack) {
    if (!track.signed_url) {
      setErrorMessage("다운로드 링크를 사용할 수 없습니다.");
      return;
    }

    setErrorMessage(null);

    try {
      const response = await fetch(track.signed_url);

      if (!response.ok) {
        throw new Error("음악을 다운로드하지 못했습니다.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = track.file_name ?? `${track.title ?? "music"}.mp3`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setErrorMessage("음악을 다운로드하지 못했습니다.");
    }
  }

  async function handleSendMessage(message: string, options: PromptOptions) {
    if (!session?.access_token) {
      setErrorMessage("음악을 생성하려면 먼저 로그인해 주세요.");
      return;
    }

    setGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/music/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          batch_size: options.batchSize,
          caption: message,
          duration: options.duration,
          lyrics: options.lyrics,
        }),
      });
      const data = (await response.json()) as {
        credits?: number;
        music?: MusicTrack[];
        error?: string;
      };

      if (typeof data.credits === "number") {
        setCredits(data.credits);
      }

      if (!response.ok) {
        if (response.status === 402) {
          setCreditModalOpen(true);
        }

        throw new Error("음악을 생성하지 못했습니다.");
      }

      setTracks((currentTracks) => [...(data.music ?? []), ...currentTracks]);
    } catch {
      setErrorMessage("음악을 생성하지 못했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main
      aria-busy={loading}
      className="min-h-screen bg-[#171717] pb-72 text-white"
    >
      <WorkspaceNavbar
        creditModalOpen={creditModalOpen}
        onCreditModalOpenChange={setCreditModalOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <section className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-4xl flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-white/36">
            AI MUSIC STUDIO
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            프롬프트로 음악을 만들어보세요.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/48 sm:text-base">
            장르, 무드, 악기, 템포, 장면을 자연스럽게 설명하세요. 생성하기
            전에 길이와 곡 수를 선택할 수 있습니다.
          </p>
        </div>

        <StatusMessage errorMessage={errorMessage} generating={generating} />
        <MusicList
          activeTrackId={currentTrack?.id}
          isActiveTrackPlaying={isPlayerPlaying}
          loading={loadingTracks}
          onDeleteTrack={handleDeleteTrack}
          onDownloadTrack={handleDownloadTrack}
          onRenameTrack={handleRenameTrack}
          onSelectTrack={(track) => {
            if (currentTrack?.id === track.id && isPlayerPlaying) {
              setPauseRequest((request) => request + 1);
              return;
            }

            setSelectedTrackId(track.id);
            if (track.signed_url) {
              setIsPlayerPlaying(true);
            }
            setPlayRequest((request) => request + 1);
          }}
          tracks={filteredTracks}
        />
      </section>
      <div className="fixed inset-x-0 bottom-[96px] z-30 flex justify-center bg-gradient-to-t from-[#171717] via-[#171717]/92 to-transparent px-4 pb-4 pt-14 sm:bottom-[84px] sm:px-6">
        <div className="w-full max-w-2xl">
          <PromptInputBox
            availableCredits={credits}
            disabled={generating}
            onInsufficientCredits={() => setCreditModalOpen(true)}
            onSend={handleSendMessage}
          />
        </div>
      </div>
      <MusicPlayer
        currentTrack={currentTrack}
        onPlaybackChange={setIsPlayerPlaying}
        onTrackChange={setSelectedTrackId}
        pauseRequest={pauseRequest}
        playRequest={playRequest}
        tracks={tracks}
      />
    </main>
  );
}
