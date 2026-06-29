import { AuthProvider } from "@/contexts/auth-context";

// 음악 생성 워크스페이스는 로그인/크레딧 상태가 필요하므로 이 구간만 AuthProvider로 감쌉니다.
export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthProvider>{children}</AuthProvider>;
}
