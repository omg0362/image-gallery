import type { Metadata } from "next";
import { KakaoAdFit } from "@/components/KakaoAdFit";
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
    default: "이예준 블로그",
    template: "%s | 이예준 블로그",
  },
  description:
    "이예준이 운영하는 개인 블로그입니다. Notion CMS로 작성한 글과 프로젝트 기록을 게시합니다.",
  applicationName: "이예준 블로그",
  authors: [{ name: "이예준", url: "mailto:omg0362@gmail.com" }],
  creator: "이예준",
  publisher: "이예준",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "이예준 블로그",
    description:
      "이예준이 운영하는 개인 블로그입니다. Notion CMS로 작성한 글과 프로젝트 기록을 게시합니다.",
    type: "website",
    locale: "ko_KR",
    siteName: "이예준 블로그",
  },
  twitter: {
    card: "summary_large_image",
    title: "이예준 블로그",
    description:
      "이예준이 운영하는 개인 블로그입니다. Notion CMS로 작성한 글과 프로젝트 기록을 게시합니다.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <KakaoAdFit />
      </body>
    </html>
  );
}
