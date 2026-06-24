"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import type { MusicTrack } from "@/components/musiclist";

type MusicPlayerProps = {
  currentTrack: MusicTrack | null;
  onPlaybackChange: (isPlaying: boolean) => void;
  onTrackChange: (trackId: string) => void;
  pauseRequest: number;
  playRequest: number;
  tracks: MusicTrack[];
};

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function MusicPlayer({
  currentTrack,
  onPlaybackChange,
  onTrackChange,
  pauseRequest,
  playRequest,
  tracks,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPauseRequestRef = useRef(pauseRequest);
  const playOnLoadRef = useRef(false);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const playableTracks = useMemo(
    () => tracks.filter((track) => Boolean(track.signed_url)),
    [tracks],
  );
  const currentTrackIndex = currentTrack
    ? playableTracks.findIndex((track) => track.id === currentTrack.id)
    : -1;
  const canPlay = Boolean(currentTrack?.signed_url);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (playRequest === 0 || !canPlay) return;

    const audio = audioRef.current;

    playOnLoadRef.current = true;

    if (audio && audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      playOnLoadRef.current = false;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          onPlaybackChange(true);
        })
        .catch(() => {
          setIsPlaying(false);
          onPlaybackChange(false);
        });
    }
  }, [canPlay, currentTrack?.id, onPlaybackChange, playRequest]);

  useEffect(() => {
    if (pauseRequest === lastPauseRequestRef.current) return;

    lastPauseRequestRef.current = pauseRequest;
    playOnLoadRef.current = false;
    audioRef.current?.pause();
    setIsPlaying(false);
    onPlaybackChange(false);
  }, [onPlaybackChange, pauseRequest]);

  async function playAudio() {
    const audio = audioRef.current;

    if (!audio || !canPlay) return;

    try {
      await audio.play();
      setIsPlaying(true);
      onPlaybackChange(true);
    } catch {
      setIsPlaying(false);
      onPlaybackChange(false);
    }
  }

  function pauseAudio() {
    playOnLoadRef.current = false;
    audioRef.current?.pause();
    setIsPlaying(false);
    onPlaybackChange(false);
  }

  function togglePlayback() {
    if (isPlaying) {
      pauseAudio();
      return;
    }

    playAudio();
  }

  function selectRelativeTrack(direction: -1 | 1, autoPlay = isPlaying) {
    if (playableTracks.length < 2) return;

    audioRef.current?.pause();

    const nextIndex =
      currentTrackIndex === -1
        ? 0
        : (currentTrackIndex + direction + playableTracks.length) %
          playableTracks.length;

    playOnLoadRef.current = autoPlay;
    onTrackChange(playableTracks[nextIndex].id);
  }

  function handleSeek(value: string) {
    const audio = audioRef.current;
    const nextTime = Number(value);

    if (!audio || !Number.isFinite(nextTime)) return;

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleVolumeChange(value: string) {
    const nextVolume = Number(value);

    if (!Number.isFinite(nextVolume)) return;

    setVolume(nextVolume);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target?.tagName === "BUTTON" ||
        target?.tagName === "INPUT" ||
        target?.tagName === "A" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (event.code !== "Space" || isEditableTarget) return;

      event.preventDefault();
      togglePlayback();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#101010]/95 px-3 py-3 text-white shadow-[0_-18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-5">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(280px,520px)_minmax(160px,1fr)]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-white/12 bg-white/[0.07] text-white/62">
            <Music className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white/90">
              {currentTrack?.title ?? currentTrack?.file_name ?? "음악을 선택하세요"}
            </p>
            <p className="mt-1 truncate text-xs text-white/42">
              {currentTrack?.prompt ?? "생성한 음악이 여기에서 재생됩니다."}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => selectRelativeTrack(-1)}
              disabled={playableTracks.length < 2}
              aria-label="이전 곡"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/64 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <SkipBack className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={togglePlayback}
              disabled={!canPlay}
              aria-label={isPlaying ? "일시정지" : "재생"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#101010] transition hover:scale-[1.03] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => selectRelativeTrack(1)}
              disabled={playableTracks.length < 2}
              aria-label="다음 곡"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/64 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="grid w-full grid-cols-[40px_1fr_40px] items-center gap-2 text-[11px] text-white/42">
            <span className="text-right">{formatTime(currentTime)}</span>
            <label className="sr-only" htmlFor="music-player-seek">
              재생 위치
            </label>
            <input
              id="music-player-seek"
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={Math.min(currentTime || 0, duration || 0)}
              disabled={!canPlay}
              onChange={(event) => handleSeek(event.target.value)}
              className="h-1 w-full accent-white disabled:opacity-30"
              style={{
                background: `linear-gradient(to right, #ffffff ${progress}%, rgba(255,255,255,0.18) ${progress}%)`,
              }}
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden items-center justify-end gap-2 sm:flex">
          <Volume2 className="h-4 w-4 text-white/52" aria-hidden="true" />
          <label className="sr-only" htmlFor="music-player-volume">
            볼륨
          </label>
          <input
            id="music-player-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume ?? 0.85}
            onChange={(event) => handleVolumeChange(event.target.value)}
            className="h-1 w-28 accent-white"
          />
        </div>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        src={currentTrack?.signed_url ?? undefined}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={() => {
          setIsPlaying(false);
          onPlaybackChange(false);
          selectRelativeTrack(1, true);
        }}
        onLoadStart={() => {
          setCurrentTime(0);
          setDuration(0);
          setIsPlaying(false);
          onPlaybackChange(false);
        }}
        onEmptied={() => {
          setCurrentTime(0);
          setDuration(0);
          setIsPlaying(false);
          onPlaybackChange(false);
        }}
        onCanPlay={(event) => {
          if (!playOnLoadRef.current) return;

          playOnLoadRef.current = false;
          event.currentTarget
            .play()
            .then(() => {
              setIsPlaying(true);
              onPlaybackChange(true);
            })
            .catch(() => {
              setIsPlaying(false);
              onPlaybackChange(false);
            });
        }}
        onPause={() => {
          setIsPlaying(false);
          onPlaybackChange(false);
        }}
        onPlay={() => {
          setIsPlaying(true);
          onPlaybackChange(true);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      />
    </footer>
  );
}
