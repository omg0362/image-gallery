import { createClient, type User } from "@supabase/supabase-js";

export const runtime = "nodejs";

type CreditPack = "pro" | "ultra";

type CheckoutRequest = {
  pack?: unknown;
};

type ProductConfig = {
  credits: number;
  envNames: string[];
  name: string;
};

const PRODUCT_CONFIG: Record<CreditPack, ProductConfig> = {
  pro: {
    credits: 100,
    envNames: ["POLAR_PRO_PRODUCT_ID", "POLAR_CREDITS_PRO_PRODUCT_ID"],
    name: "Pro",
  },
  ultra: {
    credits: 1100,
    envNames: ["POLAR_ULTRA_PRODUCT_ID", "POLAR_CREDITS_ULTRA_PRODUCT_ID"],
    name: "Ultra",
  },
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing server environment variable: ${name}.`);
  }

  return value;
}

function getFirstEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name];

    if (value) {
      return value;
    }
  }

  throw new Error(
    `Missing server environment variable: ${names.join(" or ")}.`,
  );
}

function getPolarAccessToken() {
  return getFirstEnv(["POLAR_API_TOKEN", "POLAR_ACCESS_TOKEN"]);
}

function getPolarBaseUrl() {
  const server = process.env.POLAR_SERVER ?? process.env.POLAR_ENVIRONMENT;

  if (server === "sandbox") {
    return "https://sandbox-api.polar.sh/v1";
  }

  return "https://api.polar.sh/v1";
}

function createUserSupabaseClient(accessToken: string) {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
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

  return data.user;
}

function getDisplayName(user: User) {
  const metadata = user.user_metadata;
  const name = metadata.full_name ?? metadata.name;

  return typeof name === "string" ? name : undefined;
}

function getOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (origin) {
    return origin;
  }

  const url = new URL(request.url);

  return url.origin;
}

function getCustomerIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return request.headers.get("x-real-ip") ?? undefined;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as CheckoutRequest;
    const pack =
      body.pack === "ultra" ? "ultra" : body.pack === "pro" ? "pro" : null;

    if (!pack) {
      return Response.json({ error: "Invalid credit pack." }, { status: 400 });
    }

    const config = PRODUCT_CONFIG[pack];
    const productId = getFirstEnv(config.envNames);
    const origin = getOrigin(request);
    const response = await fetch(`${getPolarBaseUrl()}/checkouts/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${getPolarAccessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: [productId],
        success_url: `${origin}/workspace?checkout_id={CHECKOUT_ID}`,
        return_url: `${origin}/workspace`,
        external_customer_id: user.id,
        customer_email: user.email,
        customer_name: getDisplayName(user),
        customer_ip_address: getCustomerIpAddress(request),
        customer_metadata: {
          supabase_user_id: user.id,
        },
        metadata: {
          credit_pack: pack,
          credits: config.credits,
          product_name: config.name,
          supabase_user_id: user.id,
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: unknown; detail?: unknown; message?: unknown; url?: unknown }
      | null;

    if (!response.ok) {
      const message =
        typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.detail === "string"
            ? payload.detail
            : "Failed to create checkout session.";

      return Response.json({ error: message }, { status: response.status });
    }

    if (!payload || typeof payload.url !== "string") {
      return Response.json(
        { error: "Polar did not return a checkout URL." },
        { status: 502 },
      );
    }

    return Response.json({ url: payload.url });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session.",
      },
      { status: 500 },
    );
  }
}
