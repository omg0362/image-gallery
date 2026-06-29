import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 루트 metadata는 모든 페이지의 기본 SEO 값입니다.
  // 상세 페이지에서는 generateMetadata로 글별 title/description을 덮어씁니다.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000",
  ),
  title: {
    default: "Notion Blog",
    template: "%s | Notion Blog",
  },
  description: "Notion 데이터베이스를 CMS로 사용하는 블로그입니다.",
  openGraph: {
    title: "Notion Blog",
    description: "Notion에서 작성하고 게시하는 블로그입니다.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
