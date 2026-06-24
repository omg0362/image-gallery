"use client";

import { MoreHorizontal, Music, Play } from "lucide-react";
import type { CSSProperties } from "react";

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
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDuration(value: number | null) {
  if (!value) return "길이 미확인";

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

function formatStatus(value: string) {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue === "completed") return "생성 완료";
  if (normalizedValue === "processing" || normalizedValue === "pending") {
    return "생성 중";
  }
  if (normalizedValue === "failed" || normalizedValue === "error") {
    return "생성 실패";
  }

  return "상태 확인 중";
}

function SoundWaveIcon() {
  const bars = [
    { delay: "0ms", height: "0.34", duration: "760ms" },
    { delay: "110ms", height: "0.58", duration: "680ms" },
    { delay: "220ms", height: "0.82", duration: "820ms" },
    { delay: "70ms", height: "0.5", duration: "720ms" },
    { delay: "180ms", height: "0.68", duration: "780ms" },
  ];

  return (
    <span
      aria-hidden="true"
      className="flex h-5 w-5 items-center justify-center gap-[2px]"
    >
      {bars.map((bar, index) => (
        <span
          key={`${bar.height}-${index}`}
          className="music-list-sound-wave-bar h-full w-[3px] rounded-full bg-[#FECD00] shadow-[0_0_10px_rgba(254,205,0,0.58)]"
          style={{
            "--wave-height": bar.height,
            "--wave-duration": bar.duration,
            animationDelay: bar.delay,
          } as CSSProperties}
        />
      ))}
    </span>
  );
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
        음악 파일을 불러오는 중...
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="rounded-[8px] border border-white/12 bg-white/[0.05] px-5 py-10 text-center">
        <Music className="mx-auto mb-3 h-6 w-6 text-white/38" aria-hidden="true" />
        <p className="text-sm font-medium text-white/72">
          아직 생성한 음악이 없습니다.
        </p>
        <p className="mt-1 text-xs text-white/42">
          생성한 음악은 저장된 뒤 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-white/12 bg-white/[0.05]">
      <div className="grid grid-cols-[1fr_auto_36px] border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/40 sm:grid-cols-[1fr_110px_120px_36px]">
        <span>음악 파일</span>
        <span className="hidden sm:block">길이</span>
        <span className="text-right">생성일</span>
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
                    className={
                      isActiveTrack && isActiveTrackPlaying
                        ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#FECD00]/45 bg-[#FECD00]/10 text-[#FECD00] shadow-[0_0_26px_rgba(254,205,0,0.16),inset_0_1px_0_rgba(255,255,255,0.18)] transition group-hover:border-[#FECD00]/70 group-hover:bg-[#FECD00]/16"
                        : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/[0.08] text-white/70 transition group-hover:border-white/22 group-hover:bg-white group-hover:text-[#171717]"
                    }
                  >
                    {isActiveTrack && isActiveTrackPlaying ? (
                      <SoundWaveIcon />
                    ) : isActiveTrack ? (
                      <Play className="ml-0.5 h-4 w-4" />
                    ) : (
                      <Music className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-white/88">
                      {track.title ?? track.file_name ?? "제목 없는 음악"}
                    </h2>
                    <p className="mt-1 truncate text-xs text-white/42">
                      {track.prompt ?? track.file_name ?? formatStatus(track.status)}
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
                  aria-label={`${track.title ?? track.file_name ?? "음악"} 옵션`}
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
                    이름 변경
                  </button>
                  <button
                    type="button"
                    disabled={!track.signed_url}
                    onClick={() => onDownloadTrack?.(track)}
                    className="block w-full rounded-[6px] px-3 py-2 text-left text-xs text-white/78 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
                  >
                    다운로드
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTrack?.(track)}
                    className="block w-full rounded-[6px] px-3 py-2 text-left text-xs text-red-200 transition hover:bg-red-400/12 hover:text-red-100"
                  >
                    삭제
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
