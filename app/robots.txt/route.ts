function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

// 검색 엔진 크롤러가 사이트맵 위치를 찾을 수 있도록 robots.txt를 동적으로 생성합니다.
export async function GET() {
  const baseUrl = getBaseUrl();

  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
