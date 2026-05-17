import Replicate, { type ApiError, type FileOutput } from "replicate";
import { createClient, type User } from "@supabase/supabase-js";

const MODEL =
  "fishaudio/ace-step-1.5:74e3a7d383b18815e277de5223f5fe9d53d38832de15aa567fe729fa129d0d85";
const MUSIC_BUCKET = "MUSICs";

export const runtime = "nodejs";
export const maxDuration = 600;

type GenerateMusicRequest = {
  batch_size?: unknown;
  caption?: unknown;
  duration?: unknown;
  lyrics?: unknown;
  prompt?: unknown;
};

type AudioOutput = {
  url: string;
};

type StoredMusicRow = {
  id: string;
  title: string | null;
  prompt: string | null;
  status: string;
  storage_bucket: string;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  created_at: string;
  completed_at: string | null;
};

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function isFileOutput(value: unknown): value is FileOutput {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    typeof (value as { url?: unknown }).url === "function"
  );
}

function toAudioOutputs(output: unknown): AudioOutput[] {
  const values = Array.isArray(output) ? output : [output];

  return values
    .map((item) => {
      if (isFileOutput(item)) {
        return { url: item.url().toString() };
      }

      if (typeof item === "string") {
        return { url: item };
      }

      return null;
    })
    .filter((item): item is AudioOutput => item !== null);
}

function isReplicateApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    "response" in error &&
    error.response instanceof Response
  );
}

async function getErrorResponse(error: unknown) {
  if (isReplicateApiError(error)) {
    if (error.response.status === 402) {
      return {
        message:
          "Replicate account has insufficient credit. Add credit in Replicate billing, wait a few minutes, then try again.",
        status: 402,
      };
    }

    return {
      message: error.message,
      status: error.response.status,
    };
  }

  return {
    message:
      error instanceof Error ? error.message : "Failed to generate music.",
    status: 500,
  };
}

function createUserSupabaseClient(accessToken: string) {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );
}

async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return null;
  }

  const supabase = createUserSupabaseClient(token);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return { token, user: data.user };
}

function getTitle(prompt: string) {
  return prompt.length > 64 ? `${prompt.slice(0, 61)}...` : prompt;
}

function getFileExtension(contentType: string | null) {
  if (contentType?.includes("wav")) return "wav";
  if (contentType?.includes("flac")) return "flac";
  if (contentType?.includes("ogg")) return "ogg";
  if (contentType?.includes("webm")) return "webm";
  if (contentType?.includes("mp4")) return "mp4";

  return "mp3";
}

function getAudioContentType(contentType: string | null) {
  const normalizedContentType =
    contentType?.split(";")[0]?.trim().toLowerCase() ?? "";

  if (normalizedContentType.startsWith("audio/")) {
    return normalizedContentType;
  }

  return "audio/mpeg";
}

async function downloadAudio(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to download generated audio.");
  }

  const contentType = getAudioContentType(response.headers.get("content-type"));
  const buffer = await response.arrayBuffer();

  return {
    buffer,
    contentType,
    size: buffer.byteLength,
  };
}

async function createSignedUrl(
  supabase: ReturnType<typeof createUserSupabaseClient>,
  storagePath: string | null,
) {
  if (!storagePath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(MUSIC_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

async function storeGeneratedAudio({
  audio,
  batchSize,
  caption,
  duration,
  index,
  lyrics,
  supabase,
  user,
}: {
  audio: AudioOutput;
  batchSize: number;
  caption: string;
  duration: number;
  index: number;
  lyrics: string;
  supabase: ReturnType<typeof createUserSupabaseClient>;
  user: User;
}) {
  const downloadedAudio = await downloadAudio(audio.url);
  const extension = getFileExtension(downloadedAudio.contentType);
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const storagePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(MUSIC_BUCKET)
    .upload(storagePath, downloadedAudio.buffer, {
      contentType: downloadedAudio.contentType,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error: insertError } = await supabase
    .from("MUSICs")
    .insert({
      user_id: user.id,
      title:
        index === 0 ? getTitle(caption) : `${getTitle(caption)} (${index + 1})`,
      prompt: caption,
      status: "completed",
      storage_bucket: MUSIC_BUCKET,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: downloadedAudio.contentType,
      file_size: downloadedAudio.size,
      duration_seconds: duration,
      completed_at: new Date().toISOString(),
      metadata: {
        batch_size: batchSize,
        lyrics,
        model: MODEL,
        source_url: audio.url,
      },
    })
    .select(
      "id,title,prompt,status,storage_bucket,storage_path,file_name,mime_type,file_size,duration_seconds,created_at,completed_at",
    )
    .single<StoredMusicRow>();

  if (insertError) {
    await supabase.storage.from(MUSIC_BUCKET).remove([storagePath]);
    throw insertError;
  }

  return {
    ...data,
    signed_url: await createSignedUrl(supabase, data.storage_path),
  };
}

export async function POST(request: Request) {
  try {
    const authentication = await getAuthenticatedUser(request);

    if (!authentication) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as GenerateMusicRequest;
    const caption =
      typeof body.caption === "string"
        ? body.caption.trim()
        : typeof body.prompt === "string"
          ? body.prompt.trim()
          : "";
    const lyrics = typeof body.lyrics === "string" ? body.lyrics.trim() : "";
    const duration = Number(body.duration ?? 90);
    const batchSize = Number(body.batch_size ?? 1);

    if (!caption) {
      return Response.json({ error: "Caption is required." }, { status: 400 });
    }

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 600 ||
      !Number.isInteger(batchSize) ||
      batchSize < 1 ||
      batchSize > 4
    ) {
      return Response.json(
        { error: "Invalid duration or batch_size." },
        { status: 400 },
      );
    }

    const replicate = new Replicate({
      auth: getEnv("REPLICATE_API_TOKEN"),
    });

    const output = await replicate.run(MODEL, {
      input: {
        caption: caption.slice(0, 512),
        duration,
        batch_size: batchSize,
        ...(lyrics ? { lyrics } : {}),
      },
      wait: {
        mode: "poll",
        interval: 2,
      },
    });
    const audio = toAudioOutputs(output);

    if (audio.length === 0) {
      return Response.json(
        { error: "The model did not return an audio file." },
        { status: 502 },
      );
    }

    const supabase = createUserSupabaseClient(authentication.token);
    const music = await Promise.all(
      audio.map((audioOutput, index) =>
        storeGeneratedAudio({
          audio: audioOutput,
          batchSize,
          caption,
          duration,
          index,
          lyrics,
          supabase,
          user: authentication.user,
        }),
      ),
    );

    return Response.json({ music });
  } catch (error) {
    const { message, status } = await getErrorResponse(error);

    return Response.json({ error: message }, { status });
  }
}
