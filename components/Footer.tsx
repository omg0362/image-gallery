// 블로그 전체에 공통으로 쓰는 푸터입니다.
// 현재 연도를 런타임에서 계산해 배포 후에도 별도 수정 없이 유지됩니다.
export function Footer() {
  return (
    <footer className="border-t border-[#dfd5c8] bg-[#f8f6f1]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-[#697586] sm:px-8 lg:px-10">
        <p className="font-medium text-[#1f2933]">Notion Blog</p>
        <p>
          © {new Date().getFullYear()} Notion Blog. Published from Notion CMS.
        </p>
      </div>
    </footer>
  );
}
