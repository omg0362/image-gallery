import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPublishedPosts, isNotionConfigured } from "@/lib/notion";

// Notion에서 글을 수정했을 때 일정 시간 후 자동으로 최신 목록을 다시 가져옵니다.
export const revalidate = 300;

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function Page() {
  const notionConfigured = isNotionConfigured();
  const posts = await getPublishedPosts();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f8f6f1]">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a5b2f]">
              Notion CMS Blog
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#1f2933] sm:text-5xl">
              Notion에서 작성하고 바로 게시하는 블로그
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#52606d]">
              Published 체크박스가 켜진 글만 최신순으로 보여줍니다. 제목,
              요약, 카테고리, 썸네일은 Notion 데이터베이스 속성에서 자동으로
              가져옵니다.
            </p>
          </div>

          {!notionConfigured ? (
            <section
              aria-label="Notion 설정 필요"
              className="border border-dashed border-[#c7b7a3] bg-white/70 p-8 text-[#52606d]"
            >
              <h2 className="text-xl font-semibold text-[#1f2933]">
                Notion 환경 변수를 기다리는 중입니다.
              </h2>
              <p className="mt-3 leading-7">
                `.env.local`에 NOTION_API_KEY와 NOTION_DATABASE_ID를 추가하면
                Published가 체크된 글을 Notion에서 불러옵니다. 지금은 키가
                없어도 로컬 화면과 라우트가 정상 동작하도록 빈 상태를
                표시합니다.
              </p>
            </section>
          ) : posts.length === 0 ? (
            <section
              aria-label="게시글 없음"
              className="border border-dashed border-[#c7b7a3] bg-white/70 p-8 text-[#52606d]"
            >
              <h2 className="text-xl font-semibold text-[#1f2933]">
                아직 공개된 게시글이 없습니다.
              </h2>
              <p className="mt-3 leading-7">
                Notion 데이터베이스에서 Published를 체크하고 Published Date,
                Slug, Summary를 입력하면 이곳에 글이 표시됩니다.
              </p>
            </section>
          ) : (
            <section
              aria-label="게시글 목록"
              className="flex max-w-4xl flex-col gap-4"
            >
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group overflow-hidden border border-[#dfd5c8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="grid gap-0 sm:grid-cols-[176px_1fr]"
                  >
                    <div className="aspect-[16/10] bg-[#e8e1d7] sm:h-full sm:min-h-44 sm:aspect-auto">
                      {post.coverImage ? (
                        // Notion 파일 URL은 만료형 서명 URL일 수 있어 next/image 도메인 화이트리스트 없이 일반 img로 표시합니다.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.coverImage}
                          alt={`${post.title} 썸네일`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-[#8a7a68]">
                          No thumbnail
                        </div>
                      )}
                    </div>
                    <div className="flex min-h-44 flex-col p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#697586]">
                        {post.category ? (
                          <span className="bg-[#1f2933] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                            {post.category}
                          </span>
                        ) : null}
                        {post.publishedDate ? (
                          <time dateTime={post.publishedDate}>
                            {dateFormatter.format(new Date(post.publishedDate))}
                          </time>
                        ) : null}
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold leading-tight text-[#1f2933]">
                        {post.title}
                      </h2>
                      <p className="mt-3 line-clamp-2 flex-1 leading-7 text-[#52606d]">
                        {post.summary || "요약이 입력되지 않았습니다."}
                      </p>
                      <span className="mt-4 text-sm font-semibold text-[#9a5b2f]">
                        글 읽기
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </section>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
