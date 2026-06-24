"use client";

import { ArrowLeft, Download, ImageIcon, Loader2, Sparkles } from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type GenerateImageResponse = {
  image: string;
  mimeType: string;
  interactionId?: string;
};

type ErrorResponse = {
  error?: string;
};

export function ImageGenerator() {
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileName = useMemo(() => {
    const slug = prompt
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42);
    const extension = mimeType === "image/png" ? "png" : "jpg";
    return `${slug || "generated-image"}.${extension}`;
  }, [mimeType, prompt]);

  useEffect(() => {
    const syncWorkspaceFromHash = () => {
      setIsWorkspaceOpen(window.location.hash === "#workspace");
    };

    syncWorkspaceFromHash();
    window.addEventListener("hashchange", syncWorkspaceFromHash);

    return () => {
      window.removeEventListener("hashchange", syncWorkspaceFromHash);
    };
  }, []);

  useEffect(() => {
    const preventBrowserFileOpen = (event: globalThis.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("dragover", preventBrowserFileOpen);
    window.addEventListener("drop", preventBrowserFileOpen);

    return () => {
      window.removeEventListener("dragover", preventBrowserFileOpen);
      window.removeEventListener("drop", preventBrowserFileOpen);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (referenceImage) {
        URL.revokeObjectURL(referenceImage.url);
      }
    };
  }, [referenceImage]);

  function openWorkspace(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    window.location.hash = "workspace";
    setIsWorkspaceOpen(true);
  }

  function closeWorkspace(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    window.history.pushState(
      "",
      document.title,
      window.location.pathname + window.location.search
    );
    setIsWorkspaceOpen(false);
  }

  async function generateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setError("만들고 싶은 이미지를 한 문장 이상 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: cleanPrompt }),
      });

      const data = (await response.json()) as GenerateImageResponse | ErrorResponse;

      if (!response.ok || !("image" in data)) {
        const message =
          "error" in data ? data.error : "이미지를 생성하지 못했습니다.";
        throw new Error(message || "이미지를 생성하지 못했습니다.");
      }

      setImage(data.image);
      setMimeType(data.mimeType || "image/jpeg");
      setIsShareOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "이미지를 생성하지 못했습니다."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setReferenceImage((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }

      return {
        name: file.name,
        url: URL.createObjectURL(file),
      };
    });
    setError(null);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageFile(files[0]);
      event.dataTransfer.clearData();
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
    event.target.value = "";
  }

  function downloadImage() {
    if (!image) return;

    const anchor = document.createElement("a");
    anchor.href = image;
    anchor.download = fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  async function shareNativeImage() {
    if (!image) return;

    try {
      const blob = await (await fetch(image)).blob();
      const file = new File([blob], fileName, { type: mimeType });
      const shareData = {
        title: "AI generated image",
        text: prompt,
        files: [file],
      };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: "AI generated image",
          text: prompt,
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setError("공유 링크를 클립보드에 복사했습니다.");
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        return;
      }
      setError("공유를 완료하지 못했습니다. 저장 후 직접 업로드해주세요.");
    }
  }

  function openSocialShare(platform: "x" | "facebook" | "instagram") {
    const encodedText = encodeURIComponent(`AI image prompt: ${prompt}`);
    const encodedUrl = encodeURIComponent(window.location.href);
    const url = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      instagram: "https://www.instagram.com/",
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    }[platform];
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!isWorkspaceOpen) {
    return (
      <section className="relative z-10 flex min-h-screen w-full items-center justify-center px-6 py-10 text-center">
        <div className="mx-auto flex max-w-6xl flex-col items-center">
          <h1 className="max-w-5xl text-center text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.55)] sm:text-6xl lg:text-[5.8rem]">
            <span className="block">무료로 원하는</span>
            <span className="block">이미지를 생성하세요</span>
          </h1>

          <p className="mt-12 max-w-3xl text-center text-2xl font-light leading-normal tracking-[-0.02em] text-white/68 sm:text-4xl">
            상상한 장면을 한 문장으로 적어보세요.
          </p>

          <button
            className="mt-14 inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-lg font-medium tracking-[-0.02em] text-black shadow-[0_18px_55px_rgba(0,0,0,0.28)] transition hover:scale-[1.03] hover:bg-white/90"
            onClick={openWorkspace}
            type="button"
          >
            시작하기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative z-10 flex min-h-screen w-full flex-col px-5 py-6 text-white"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium text-white/86 backdrop-blur-md transition hover:bg-white/18"
          onClick={closeWorkspace}
          type="button"
        >
          <ArrowLeft aria-hidden className="size-4" />
          돌아가기
        </button>
        <span className="text-sm font-light tracking-[0.24em] text-white/48">
          IMAGE WORKSPACE
        </span>
      </div>

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-10 py-8 lg:grid-cols-[410px_1fr]">
        <form className="space-y-4" onSubmit={generateImage}>
          <div>
            <label
              className="mb-3 block text-sm font-medium tracking-[-0.01em] text-white/76"
              htmlFor="prompt"
            >
              만들고 싶은 이미지
            </label>
            <textarea
              id="prompt"
              className="min-h-56 w-full resize-none rounded-3xl border border-white/18 bg-black/24 p-5 text-lg font-light leading-8 text-white shadow-[0_18px_60px_rgba(0,0,0,0.25)] outline-none backdrop-blur-xl placeholder:text-white/38 focus:border-white/46"
              onChange={(event) => setPrompt(event.target.value)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              placeholder="예: 비 오는 밤, 네온사인이 비치는 서울 골목의 영화 포스터"
              value={prompt}
            />
          </div>

          <label
            className="flex cursor-pointer items-center justify-between gap-4 rounded-full bg-white/10 px-5 py-3 text-sm font-light text-white/74 backdrop-blur-md transition hover:bg-white/16"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <span className="truncate">
              {referenceImage ? referenceImage.name : "참고 이미지 드롭 또는 선택"}
            </span>
            <span className="shrink-0 text-white">파일 선택</span>
            <input
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              type="file"
            />
          </label>

          <button
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-lg font-medium text-black shadow-[0_18px_55px_rgba(0,0,0,0.28)] transition hover:scale-[1.01] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-55"
            disabled={isGenerating}
            type="submit"
          >
            {isGenerating ? (
              <Loader2 aria-hidden className="size-5 animate-spin" />
            ) : (
              <Sparkles aria-hidden className="size-5" />
            )}
            {isGenerating ? "생성 중..." : "이미지 생성하기"}
          </button>

          {error ? (
            <p className="rounded-2xl border border-red-300/20 bg-red-950/30 px-4 py-3 text-sm text-red-100 backdrop-blur-md">
              {error}
            </p>
          ) : null}
        </form>

        <div className="flex min-h-[640px] flex-col justify-center">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-5xl font-semibold tracking-[-0.045em] text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.50)]">
                생성 결과
              </h2>
              <p className="mt-4 max-w-xl text-xl font-light leading-normal text-white/64">
                완성된 이미지를 확인하고 저장하거나 공유하세요.
              </p>
            </div>

            <div className="relative flex flex-col items-end gap-2">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-base font-medium text-black shadow-[0_14px_45px_rgba(0,0,0,0.25)] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!image}
                onClick={downloadImage}
                type="button"
              >
                <Download aria-hidden className="size-4" />
                저장
              </button>
              <button
                className="inline-flex h-8 items-center justify-center rounded-full bg-white/10 px-3 text-xs font-medium text-white/74 backdrop-blur-md transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!image}
                onClick={() => setIsShareOpen((current) => !current)}
                type="button"
              >
                공유
              </button>
              {image && isShareOpen ? (
                <div className="absolute right-0 top-[88px] z-20 flex items-center gap-2 rounded-full bg-black/38 px-2 py-2 shadow-[0_18px_55px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                  <button
                    aria-label="Facebook에 공유"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-[#1877f2] text-white transition hover:scale-105"
                    onClick={() => openSocialShare("facebook")}
                    type="button"
                  >
                    <FacebookIcon />
                  </button>
                  <button
                    aria-label="Instagram 열기"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_110%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285aeb_90%)] text-white transition hover:scale-105"
                    onClick={() => openSocialShare("instagram")}
                    type="button"
                  >
                    <InstagramIcon />
                  </button>
                  <button
                    aria-label="X에 공유"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-black text-white ring-1 ring-white/15 transition hover:scale-105"
                    onClick={() => openSocialShare("x")}
                    type="button"
                  >
                    <XBrandIcon />
                  </button>
                  <button
                    aria-label="기본 공유"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
                    onClick={shareNativeImage}
                    type="button"
                  >
                    <Sparkles aria-hidden className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-[470px] items-center justify-center">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Generated image"
                className="max-h-[68vh] max-w-full rounded-[2rem] object-contain shadow-[0_35px_120px_rgba(0,0,0,0.45)]"
                src={image}
              />
            ) : (
              <div className="flex flex-col items-center gap-5 text-center text-white/62">
                {referenceImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="업로드한 참고 이미지"
                    className="max-h-64 max-w-80 rounded-3xl object-contain shadow-[0_28px_90px_rgba(0,0,0,0.36)]"
                    src={referenceImage.url}
                  />
                ) : (
                  <ImageIcon aria-hidden className="size-16 text-white/72" />
                )}
                <p className="max-w-md text-lg font-light leading-8 text-white/64">
                  {referenceImage
                    ? "참고 이미지가 추가되었습니다. 원하는 이미지를 설명해 주세요."
                    : "왼쪽에 원하는 이미지를 설명하면 이곳에 결과가 나타납니다."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.2-1.5 1.5-1.5h1.7V4.6c-.8-.1-1.7-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.2H7.2V14H10v8h3.5Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden className="size-4" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="2" />
      <circle cx="16.8" cy="7.2" r="1.1" fill="currentColor" />
    </svg>
  );
}

function XBrandIcon() {
  return (
    <svg aria-hidden className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.7 3h3.1l-6.8 7.8L22 21h-6.5l-5.1-6.6L4.6 21H1.5l7.3-8.4L1 3h6.7l4.6 6 5.4-6Zm-1.1 16.2h1.7L6.8 4.7H5l11.6 14.5Z" />
    </svg>
  );
}
