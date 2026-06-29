// 블로그 전체에 공통으로 쓰는 푸터입니다.
// 현재 연도를 런타임에서 계산해 배포 후에도 별도 수정 없이 유지됩니다.
export function Footer() {
  return (
    <footer className="border-t border-[#dfd5c8] bg-[#f8f6f1]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-[#697586] sm:px-8 lg:px-10">
        <p className="font-medium text-[#1f2933]">이예준 블로그</p>
        <address className="not-italic leading-6">
          <p>소유자: 이예준</p>
          <p>
            이메일:{" "}
            <a
              href="mailto:omg0362@gmail.com"
              className="font-medium text-[#1f2933] underline-offset-4 hover:underline"
            >
              omg0362@gmail.com
            </a>
          </p>
        </address>
        <p>
          © {new Date().getFullYear()} 이예준. Published from Notion CMS.
        </p>
      </div>
    </footer>
  );
}
