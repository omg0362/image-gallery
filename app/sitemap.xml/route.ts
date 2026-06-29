import { getPublishedPosts, isNotionConfigured } from "@/lib/notion";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

// Published 글 목록을 기반으로 검색 엔진용 sitemap.xml을 생성합니다.
export async function GET() {
  const baseUrl = getBaseUrl();
  const posts = isNotionConfigured() ? await getPublishedPosts() : [];

  const urls = [
    {
      loc: baseUrl,
      lastmod: new Date().toISOString(),
    },
    ...posts.map((post) => ({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.publishedDate
        ? new Date(post.publishedDate).toISOString()
        : new Date().toISOString(),
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
