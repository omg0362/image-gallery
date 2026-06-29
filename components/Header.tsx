import Link from "next/link";

// 모든 블로그 페이지 상단에 공통으로 표시되는 시맨틱 헤더입니다.
// 홈 링크와 간단한 내비게이션만 두어 콘텐츠에 집중하도록 구성했습니다.
export function Header() {
  return (
    <header className="border-b border-[#dfd5c8] bg-[#f8f6f1]/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[#1f2933]"
          aria-label="Notion Blog 홈"
        >
          Notion Blog
        </Link>
        <nav aria-label="주요 메뉴" className="flex items-center gap-5">
          <Link
            href="/"
            className="text-sm font-medium text-[#52606d] transition hover:text-[#9a5b2f]"
          >
            Posts
          </Link>
        </nav>
      </div>
    </header>
  );
}
