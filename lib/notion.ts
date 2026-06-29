import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints/common";
import type { QueryDataSourceResponse } from "@notionhq/client/build/src/api-endpoints/data-sources";
import { NotionToMarkdown } from "notion-to-md";
import { cache } from "react";

// Notion 데이터베이스 속성 이름을 한 곳에 모아 오타를 방지합니다.
// Notion의 속성명을 변경하면 이 객체의 값도 함께 수정해야 합니다.
const PROPERTY = {
  title: "Name",
  slug: "Slug",
  published: "Published",
  publishedDate: "Published Date",
  summary: "Summary",
  category: "Category",
  files: "Files",
} as const;

const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID;

// 공식 Notion SDK 클라이언트입니다. 서버 컴포넌트와 route handler에서만 사용합니다.
const notion = new Client({
  auth: notionApiKey,
});

// notion-to-md는 Notion 페이지 블록을 Markdown 문자열로 변환합니다.
// react-markdown은 상세 페이지에서 이 Markdown을 안전하게 React로 렌더링합니다.
const notionToMarkdown = new NotionToMarkdown({ notionClient: notion });

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  publishedDate: string;
  coverImage: string;
};

export type BlogPostWithMarkdown = BlogPost & {
  markdown: string;
};

export function isNotionConfigured() {
  return Boolean(notionApiKey && databaseId);
}

function isFullPage(
  page: QueryDataSourceResponse["results"][number],
): page is PageObjectResponse {
  return "properties" in page;
}

function richTextToPlainText(richText: RichTextItemResponse[] | undefined) {
  return richText?.map((item) => item.plain_text).join("") ?? "";
}

function getTitle(page: PageObjectResponse) {
  const property = page.properties[PROPERTY.title];
  return property?.type === "title"
    ? richTextToPlainText(property.title)
    : "Untitled";
}

function getRichText(page: PageObjectResponse, propertyName: string) {
  const property = page.properties[propertyName];
  return property?.type === "rich_text"
    ? richTextToPlainText(property.rich_text)
    : "";
}

function getDate(page: PageObjectResponse) {
  const property = page.properties[PROPERTY.publishedDate];
  return property?.type === "date" ? property.date?.start ?? "" : "";
}

function getCategory(page: PageObjectResponse) {
  const property = page.properties[PROPERTY.category];
  return property?.type === "select" ? property.select?.name ?? "" : "";
}

function getCoverImage(page: PageObjectResponse) {
  const property = page.properties[PROPERTY.files];

  if (property?.type !== "files" || property.files.length === 0) {
    return "";
  }

  const firstFile = property.files[0];

  // Notion files는 내부 업로드(file)와 외부 링크(external) 두 종류가 있습니다.
  if (firstFile.type === "file") {
    return firstFile.file.url;
  }

  if (firstFile.type === "external") {
    return firstFile.external.url;
  }

  return "";
}

function mapPageToBlogPost(page: PageObjectResponse): BlogPost {
  return {
    id: page.id,
    title: getTitle(page),
    slug: getRichText(page, PROPERTY.slug),
    summary: getRichText(page, PROPERTY.summary),
    category: getCategory(page),
    publishedDate: getDate(page),
    coverImage: getCoverImage(page),
  };
}

function filterUsablePages(
  pages: QueryDataSourceResponse["results"],
) {
  // Partial page는 properties가 없어 블로그 카드로 만들 수 없고,
  // slug가 비어 있으면 상세 URL을 만들 수 없으므로 제외합니다.
  return pages
    .filter((page): page is PageObjectResponse => isFullPage(page))
    .map(mapPageToBlogPost)
    .filter((post) => post.slug.length > 0);
}

export const getPublishedPosts = cache(async (): Promise<BlogPost[]> => {
  if (!isNotionConfigured()) {
    return [];
  }

  const dataSourceId = await getPrimaryDataSourceId();

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: PROPERTY.published,
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: PROPERTY.publishedDate,
        direction: "descending",
      },
    ],
    result_type: "page",
  });

  return filterUsablePages(response.results);
});

export const getPostBySlug = cache(
  async (slug: string): Promise<BlogPostWithMarkdown | null> => {
    if (!isNotionConfigured()) {
      return null;
    }

    const dataSourceId = await getPrimaryDataSourceId();

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        and: [
          {
            property: PROPERTY.published,
            checkbox: {
              equals: true,
            },
          },
          {
            property: PROPERTY.slug,
            rich_text: {
              equals: slug,
            },
          },
        ],
      },
      page_size: 1,
      result_type: "page",
    });

    const page = response.results.find(isFullPage);

    if (!page) {
      return null;
    }

    const markdownBlocks = await notionToMarkdown.pageToMarkdown(page.id);
    const markdown = notionToMarkdown.toMarkdownString(markdownBlocks).parent;

    return {
      ...mapPageToBlogPost(page),
      markdown,
    };
  },
);

const getPrimaryDataSourceId = cache(async () => {
  const database = await notion.databases.retrieve({
    database_id: databaseId!,
  });

  if ("data_sources" in database && database.data_sources.length > 0) {
    return database.data_sources[0].id;
  }

  throw new Error(
    "NOTION_DATABASE_ID에 연결된 data source를 찾을 수 없습니다.",
  );
});
