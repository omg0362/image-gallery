import { AuthProvider } from "@/contexts/auth-context";

// 인증 페이지에서만 Supabase 세션 동기화를 실행합니다.
// 블로그 공개 페이지는 인증이 필요 없으므로 루트 layout에서 Provider를 제거했습니다.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthProvider>{children}</AuthProvider>;
}
