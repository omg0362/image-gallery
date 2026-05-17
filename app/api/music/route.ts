import { createClient } from "@supabase/supabase-js";

const MUSIC_BUCKET = "MUSICs";

export const runtime = "nodejs";

type MusicRow = {
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

async function getAuthenticatedClient(request: Request) {
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

  return supabase;
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function withSignedUrl(
  supabase: ReturnType<typeof createUserSupabaseClient>,
  music: MusicRow,
) {
  if (!music.storage_path) {
    return { ...music, signed_url: null };
  }

  const { data, error } = await supabase.storage
    .from(MUSIC_BUCKET)
    .createSignedUrl(music.storage_path, 60 * 60);

  if (error) {
    throw error;
  }

  return { ...music, signed_url: data.signedUrl };
}

export async function GET(request: Request) {
  try {
    const supabase = await getAuthenticatedClient(request);

    if (!supabase) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("MUSICs")
      .select(
        "id,title,prompt,status,storage_bucket,storage_path,file_name,mime_type,file_size,duration_seconds,created_at,completed_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const music = await Promise.all(
      ((data ?? []) as MusicRow[]).map((row) => withSignedUrl(supabase, row)),
    );

    return Response.json({ music });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load music list.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getAuthenticatedClient(request);

    if (!supabase) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      id?: unknown;
      title?: unknown;
    };
    const id = getStringValue(body.id);
    const title = getStringValue(body.title);

    if (!id || !title) {
      return Response.json(
        { error: "Music id and title are required." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("MUSICs")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(
        "id,title,prompt,status,storage_bucket,storage_path,file_name,mime_type,file_size,duration_seconds,created_at,completed_at",
      )
      .single<MusicRow>();

    if (error) {
      throw error;
    }

    return Response.json({
      music: await withSignedUrl(supabase, data),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to rename music.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await getAuthenticatedClient(request);

    if (!supabase) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";

    if (!id) {
      return Response.json({ error: "Music id is required." }, { status: 400 });
    }

    const { data: music, error: selectError } = await supabase
      .from("MUSICs")
      .select("id,storage_path")
      .eq("id", id)
      .single<{ id: string; storage_path: string | null }>();

    if (selectError) {
      throw selectError;
    }

    if (music.storage_path) {
      const { error: removeError } = await supabase.storage
        .from(MUSIC_BUCKET)
        .remove([music.storage_path]);

      if (removeError) {
        throw removeError;
      }
    }

    const { error: deleteError } = await supabase
      .from("MUSICs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return Response.json({ id });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete music.",
      },
      { status: 500 },
    );
  }
}
