"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { Coins, FileText, Layers, Send, Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PromptOptions = {
  batchSize: number;
  duration: number;
  lyrics: string;
};

type PromptInputBoxProps = {
  onSend: (message: string, options: PromptOptions) => void;
  availableCredits?: number | null;
  className?: string;
  disabled?: boolean;
  onInsufficientCredits?: () => void;
};

const durationOptions = [
  { extraCredits: 0, label: "1분", value: 60 },
  { extraCredits: 1, label: "2분", value: 120 },
  { extraCredits: 2, label: "3분", value: 180 },
];

const batchSizeOptions = [1, 2, 3, 4];

function getDurationExtraCredits(duration: number) {
  return Math.max(0, duration / 60 - 1);
}

function getBatchExtraCredits(batchSize: number) {
  return Math.max(0, batchSize - 1);
}

function getCreditCost(duration: number, batchSize: number) {
  return 1 + getDurationExtraCredits(duration) + getBatchExtraCredits(batchSize);
}

function formatExtraCredits(extraCredits: number) {
  return extraCredits > 0 ? `+${extraCredits}` : "기본";
}

function LyricsModal({
  lyrics,
  onClose,
  onSave,
}: {
  lyrics: string;
  onClose: () => void;
  onSave: (lyrics: string) => void;
}) {
  const [draftLyrics, setDraftLyrics] = useState(lyrics);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lyrics-modal-title"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl rounded-[8px] border border-white/14 bg-[#202020] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onMouseDown={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 id="lyrics-modal-title" className="text-sm font-semibold">
              가사
            </h2>
            <p className="mt-1 text-xs text-white/42">
              [Verse], [Chorus] 같은 태그와 함께 가사를 입력하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="가사 닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/52 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <label className="sr-only" htmlFor="lyrics-textarea">
          가사
        </label>
        <textarea
          id="lyrics-textarea"
          value={draftLyrics ?? ""}
          onChange={(event) => setDraftLyrics(event.target.value)}
          rows={10}
          placeholder={"[Verse]\n가사를 입력하세요..."}
          className="w-full resize-none rounded-[8px] border border-white/12 bg-white/[0.06] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/32 focus:border-white/24 focus:ring-2 focus:ring-white/10"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-full px-4 text-xs font-semibold text-white/62 transition hover:bg-white/10 hover:text-white"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draftLyrics.trim());
              onClose();
            }}
            className="h-9 rounded-full bg-white px-4 text-xs font-semibold text-[#171717] transition hover:bg-white/90"
          >
            가사 저장
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function PromptInputBox({
  availableCredits = null,
  className,
  disabled = false,
  onInsufficientCredits,
  onSend,
}: PromptInputBoxProps) {
  const [batchSize, setBatchSize] = useState(1);
  const [duration, setDuration] = useState(60);
  const [lyrics, setLyrics] = useState("");
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [openPopover, setOpenPopover] = useState<"duration" | "batch" | null>(
    null,
  );
  const creditCost = useMemo(
    () => getCreditCost(duration, batchSize),
    [batchSize, duration],
  );
  const durationExtraCredits = getDurationExtraCredits(duration);
  const batchExtraCredits = getBatchExtraCredits(batchSize);
  const hasInsufficientCredits =
    typeof availableCredits === "number" && availableCredits < creditCost;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    if (hasInsufficientCredits) {
      onInsufficientCredits?.();
      return;
    }

    onSend(trimmedMessage, {
      batchSize,
      duration,
      lyrics,
    });
    setMessage("");
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "rounded-[28px] border border-white/14 bg-white/[0.075] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-2xl",
          className,
        )}
      >
        <div className="mb-2 flex flex-wrap gap-2 px-2 pt-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setLyricsOpen(true)}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 text-xs text-white/68 transition hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            {lyrics ? "가사 추가됨" : "가사"}
          </button>

          <div className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                setOpenPopover((current) =>
                  current === "duration" ? null : "duration",
                )
              }
              className="inline-flex h-8 items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 text-xs text-white/68 transition hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />
              {duration / 60}분
              {durationExtraCredits > 0 ? (
                <span className="rounded-full bg-white/12 px-1.5 py-0.5 text-[10px] text-white/70">
                  +{durationExtraCredits}
                </span>
              ) : null}
            </button>
            {openPopover === "duration" ? (
              <div className="absolute bottom-[calc(100%+8px)] left-0 z-20 w-36 rounded-[8px] border border-white/12 bg-[#222]/95 p-1 shadow-[0_18px_42px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setDuration(option.value);
                      setOpenPopover(null);
                    }}
                    className="flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left text-xs text-white/78 transition hover:bg-white/10 hover:text-white"
                  >
                    <span>{option.label}</span>
                    <span className="text-[10px] text-white/46">
                      {formatExtraCredits(option.extraCredits)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                setOpenPopover((current) =>
                  current === "batch" ? null : "batch",
                )
              }
              className="inline-flex h-8 items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 text-xs text-white/68 transition hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              {batchSize}곡
              {batchExtraCredits > 0 ? (
                <span className="rounded-full bg-white/12 px-1.5 py-0.5 text-[10px] text-white/70">
                  +{batchExtraCredits}
                </span>
              ) : null}
            </button>
            {openPopover === "batch" ? (
              <div className="absolute bottom-[calc(100%+8px)] left-0 z-20 w-36 rounded-[8px] border border-white/12 bg-[#222]/95 p-1 shadow-[0_18px_42px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                {batchSizeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setBatchSize(option);
                      setOpenPopover(null);
                    }}
                    className="flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left text-xs text-white/78 transition hover:bg-white/10 hover:text-white"
                  >
                    <span>
                      {option}곡
                    </span>
                    <span className="text-[10px] text-white/46">
                      {formatExtraCredits(getBatchExtraCredits(option))}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={disabled || !hasInsufficientCredits}
            onClick={() => onInsufficientCredits?.()}
            className={cn(
              "ml-auto inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs transition",
              hasInsufficientCredits
                ? "border-red-300/24 bg-red-400/10 text-red-100 hover:bg-red-400/16"
                : "cursor-default border-white/12 bg-white/[0.06] text-white/68",
            )}
          >
            <Coins className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{creditCost} 크레딧</span>
            {typeof availableCredits === "number" ? (
              <span className="text-white/42">
                {availableCredits.toLocaleString()} 남음
              </span>
            ) : null}
          </button>
        </div>

        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="workspace-prompt">
            음악 스타일 프롬프트
          </label>
          <textarea
            id="workspace-prompt"
            value={message ?? ""}
            disabled={disabled}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="장르, 악기, 무드, 장면을 설명하세요..."
            rows={1}
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm leading-5 text-white outline-none placeholder:text-white/36"
            onKeyDown={(event) => {
              if (disabled) return;

              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />

          <button
            type="submit"
            disabled={disabled || (!message.trim() && !hasInsufficientCredits)}
            onClick={(event) => {
              if (!hasInsufficientCredits) {
                return;
              }

              event.preventDefault();
              onInsufficientCredits?.();
            }}
            aria-label="음악 생성"
            className={cn(
              "mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[0_10px_28px_rgba(255,255,255,0.18)] transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100",
              hasInsufficientCredits
                ? "bg-red-100 text-[#171717] hover:bg-red-50"
                : "bg-white text-[#171717] hover:bg-white/90",
            )}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      {lyricsOpen ? (
        <LyricsModal
          lyrics={lyrics}
          onClose={() => setLyricsOpen(false)}
          onSave={setLyrics}
        />
      ) : null}
    </>
  );
}
