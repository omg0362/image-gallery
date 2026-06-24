export const runtime = "nodejs";

type InteractionResponse = {
  id?: string;
  output_image?: InteractionImage;
  outputImage?: InteractionImage;
  steps?: Array<{
    content?: InteractionImage[];
  }>;
  error?: {
    message?: string;
  };
};

type InteractionImage = {
  data?: string;
  mime_type?: string;
  mimeType?: string;
  type?: string;
};

function findGeneratedImage(data: InteractionResponse | null) {
  if (!data) {
    return undefined;
  }

  if (data.output_image?.data) {
    return data.output_image;
  }

  if (data.outputImage?.data) {
    return data.outputImage;
  }

  for (const step of data.steps ?? []) {
    const image = step.content?.find(
      (item) => item.type === "image" && typeof item.data === "string"
    );

    if (image) {
      return image;
    }
  }

  return undefined;
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_API_KEY is missing in .env." },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    prompt?: unknown;
  } | null;
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return Response.json({ error: "Prompt is required." }, { status: 400 });
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "gemini-3.1-flash-image",
        input: [{ type: "text", text: prompt }],
        response_format: {
          type: "image",
          mime_type: "image/jpeg",
        },
      }),
    }
  );

  const data = (await response.json().catch(() => null)) as
    | InteractionResponse
    | null;

  if (!response.ok) {
    return Response.json(
      {
        error:
          data?.error?.message ||
          `Image generation failed with status ${response.status}.`,
      },
      { status: response.status }
    );
  }

  const outputImage = findGeneratedImage(data);
  const imageData = outputImage?.data;
  const mimeType = outputImage?.mime_type || outputImage?.mimeType || "image/jpeg";

  if (!imageData) {
    return Response.json(
      { error: "The image API response did not include image data." },
      { status: 502 }
    );
  }

  return Response.json({
    image: `data:${mimeType};base64,${imageData}`,
    mimeType,
    interactionId: data?.id,
  });
}
