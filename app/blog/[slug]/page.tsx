import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPostBySlug, getPublishedPosts } from "@/lib/notion";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 300;

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export async function generateStaticParams() {
  const posts = await getPublishedPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "게시글을 찾을 수 없습니다",
    };
  }

  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.publishedDate || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f8f6f1]">
        <article className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <Link
            href="/"
            className="text-sm font-semibold text-[#9a5b2f] transition hover:text-[#6f3d1f]"
          >
            ← 모든 글
          </Link>

          <header className="mt-8">
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

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#1f2933] sm:text-5xl">
              {post.title}
            </h1>

            {post.summary ? (
              <p className="mt-5 text-xl leading-8 text-[#52606d]">
                {post.summary}
              </p>
            ) : null}
          </header>

          {post.coverImage ? (
            <div className="mt-10 overflow-hidden border border-[#dfd5c8] bg-[#e8e1d7]">
              {/* Notion Files 속성의 첫 번째 이미지를 상세 페이지 최상단 대표 이미지로 표시합니다. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={`${post.title} 대표 이미지`}
                className="max-h-[560px] w-full object-cover"
              />
            </div>
          ) : null}

          <div className="notion-prose mt-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
              {post.markdown}
            </ReactMarkdown>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
