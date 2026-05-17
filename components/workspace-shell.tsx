"use client";

import { useEffect, useMemo, useState } from "react";
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
  const letters = "Loading".split("");

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
  const { loading, session, user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let ignore = false;

    async function loadTracks() {
      setLoadingTracks(true);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/music", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });
        const data = (await response.json()) as {
          music?: MusicTrack[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load music list.");
        }

        if (!ignore) {
          setTracks(data.music ?? []);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load music list.",
          );
        }
      } finally {
        if (!ignore) {
          setLoadingTracks(false);
        }
      }
    }

    loadTracks();

    return () => {
      ignore = true;
    };
  }, [session?.access_token]);

  async function handleRenameTrack(track: MusicTrack) {
    if (!session?.access_token) {
      setErrorMessage("Please sign in before renaming music.");
      return;
    }

    const nextTitle = window.prompt(
      "Rename music",
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
        throw new Error(data.error ?? "Failed to rename music.");
      }

      setTracks((currentTracks) =>
        currentTracks.map((currentTrack) =>
          currentTrack.id === data.music?.id ? data.music : currentTrack,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to rename music.",
      );
    }
  }

  async function handleDeleteTrack(track: MusicTrack) {
    if (!session?.access_token) {
      setErrorMessage("Please sign in before deleting music.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${track.title ?? track.file_name ?? "this music"}"?`,
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
      const data = (await response.json()) as {
        id?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete music.");
      }

      setTracks((currentTracks) =>
        currentTracks.filter((currentTrack) => currentTrack.id !== track.id),
      );

      if (selectedTrackId === track.id) {
        setSelectedTrackId(null);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete music.",
      );
    }
  }

  async function handleDownloadTrack(track: MusicTrack) {
    if (!track.signed_url) {
      setErrorMessage("Download URL is not available.");
      return;
    }

    setErrorMessage(null);

    try {
      const response = await fetch(track.signed_url);

      if (!response.ok) {
        throw new Error("Failed to download music.");
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
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to download music.",
      );
    }
  }

  async function handleSendMessage(message: string, options: PromptOptions) {
    if (!session?.access_token) {
      setErrorMessage("Please sign in before generating music.");
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
        music?: MusicTrack[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate music.");
      }

      setTracks((currentTracks) => [...(data.music ?? []), ...currentTracks]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to generate music.",
      );
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <section className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-4xl flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-white/36">
            AI MUSIC STUDIO
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Turn a prompt into a track.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/48 sm:text-base">
            Describe a genre, mood, instruments, tempo, or scene. The first
            version generates a 30 second instrumental mp3.
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
            setPlayRequest((request) => request + 1);
          }}
          tracks={filteredTracks}
        />
      </section>
      <div className="fixed inset-x-0 bottom-[96px] z-30 flex justify-center bg-gradient-to-t from-[#171717] via-[#171717]/92 to-transparent px-4 pb-4 pt-14 sm:bottom-[84px] sm:px-6">
        <div className="w-full max-w-2xl">
          <PromptInputBox disabled={generating} onSend={handleSendMessage} />
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
