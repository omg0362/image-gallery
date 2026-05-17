"use client";

import { MoreHorizontal, Music, Pause, Play } from "lucide-react";

export type MusicTrack = {
  id: string;
  title: string | null;
  prompt: string | null;
  status: string;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  created_at: string;
  completed_at: string | null;
  signed_url: string | null;
};

type MusicListProps = {
  activeTrackId?: string | null;
  isActiveTrackPlaying?: boolean;
  loading?: boolean;
  onDeleteTrack?: (track: MusicTrack) => void;
  onDownloadTrack?: (track: MusicTrack) => void;
  onRenameTrack?: (track: MusicTrack) => void;
  onSelectTrack?: (track: MusicTrack) => void;
  tracks: MusicTrack[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDuration(value: number | null) {
  if (!value) return "Unknown length";

  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function formatFileSize(value: number | null) {
  if (!value) return null;

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function MusicList({
  activeTrackId,
  isActiveTrackPlaying = false,
  loading = false,
  onDeleteTrack,
  onDownloadTrack,
  onRenameTrack,
  onSelectTrack,
  tracks,
}: MusicListProps) {
  if (loading) {
    return (
      <div className="rounded-[8px] border border-white/12 bg-white/[0.05] px-5 py-4 text-sm text-white/58">
        Loading music files...
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="rounded-[8px] border border-white/12 bg-white/[0.05] px-5 py-10 text-center">
        <Music className="mx-auto mb-3 h-6 w-6 text-white/38" aria-hidden="true" />
        <p className="text-sm font-medium text-white/72">No music files yet.</p>
        <p className="mt-1 text-xs text-white/42">
          Generated tracks will appear here after they are saved.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-white/12 bg-white/[0.05]">
      <div className="grid grid-cols-[1fr_auto_36px] border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/40 sm:grid-cols-[1fr_110px_120px_36px]">
        <span>Music file</span>
        <span className="hidden sm:block">Duration</span>
        <span className="text-right">Created</span>
        <span aria-hidden="true" />
      </div>
      <div className="divide-y divide-white/10">
        {tracks.map((track) => {
          const fileSize = formatFileSize(track.file_size);
          const isActiveTrack = activeTrackId === track.id;

          return (
            <div
              key={track.id}
              className="group grid w-full gap-3 px-4 py-4 text-left transition hover:bg-white/[0.04] sm:grid-cols-[1fr_110px_120px_36px] sm:items-center"
            >
              <button
                type="button"
                onClick={() => onSelectTrack?.(track)}
                className="min-w-0 text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/[0.08] text-white/70 transition group-hover:border-white/22 group-hover:bg-white group-hover:text-[#171717]"
                  >
                    {isActiveTrack && isActiveTrackPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : isActiveTrack ? (
                      <Play className="ml-0.5 h-4 w-4" />
                    ) : (
                      <Music className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-white/88">
                      {track.title ?? track.file_name ?? "Untitled track"}
                    </h2>
                    <p className="mt-1 truncate text-xs text-white/42">
                      {track.prompt ?? track.file_name ?? track.status}
                      {fileSize ? ` - ${fileSize}` : ""}
                    </p>
                  </div>
                </div>
              </button>
              <span className="hidden text-sm text-white/54 sm:block">
                {formatDuration(track.duration_seconds)}
              </span>
              <time
                dateTime={track.created_at}
                className="text-left text-xs text-white/42 sm:text-right"
              >
                {formatDate(track.created_at)}
              </time>
              <div className="relative flex justify-end">
                <button
                  type="button"
                  aria-label={`${track.title ?? track.file_name ?? "Music"} options`}
                  className="peer flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white focus:outline-none"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="pointer-events-none absolute right-0 top-[calc(100%+6px)] z-20 w-36 translate-y-1 rounded-[8px] border border-white/12 bg-[#222]/95 p-1 opacity-0 shadow-[0_18px_42px_rgba(0,0,0,0.35)] backdrop-blur-xl transition peer-focus:pointer-events-auto peer-focus:translate-y-0 peer-focus:opacity-100 hover:pointer-events-auto hover:translate-y-0 hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onRenameTrack?.(track)}
                    className="block w-full rounded-[6px] px-3 py-2 text-left text-xs text-white/78 transition hover:bg-white/10 hover:text-white"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    disabled={!track.signed_url}
                    onClick={() => onDownloadTrack?.(track)}
                    className="block w-full rounded-[6px] px-3 py-2 text-left text-xs text-white/78 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTrack?.(track)}
                    className="block w-full rounded-[6px] px-3 py-2 text-left text-xs text-red-200 transition hover:bg-red-400/12 hover:text-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
