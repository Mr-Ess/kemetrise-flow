import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { SiteSection } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui-kit";
import { formatDate } from "@/lib/format";
import { getNewsArticle } from "@/lib/site.functions";

export const Route = createFileRoute("/_site/news/$slug")({
  loader: async ({ params }) => {
    const article = await getNewsArticle({ data: { slug: params.slug } });
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return {
        meta: [{ title: "الخبر غير متاح | KemetRise" }, { name: "robots", content: "noindex" }],
      };
    const { article } = loaderData;
    const desc = (article.excerpt ?? article.title).slice(0, 155);
    return {
      meta: [
        { title: `${article.title} | KemetRise` },
        { name: "description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:title", content: article.title },
        { property: "og:description", content: desc },
      ],
    };
  },
  notFoundComponent: ArticleMissing,
  errorComponent: ArticleMissing,
  component: ArticlePage,
});

function ArticleMissing() {
  return (
    <SiteSection>
      <EmptyState title="الخبر غير موجود" description="ربما تم حذفه أو تغيير رابطه." />
      <Button asChild size="sm" variant="outline" className="mt-4">
        <Link to="/news">كل الأخبار</Link>
      </Button>
    </SiteSection>
  );
}

function ArticlePage() {
  const { article } = Route.useLoaderData();
  return (
    <SiteSection className="max-w-3xl">
      <p className="text-xs text-primary">{article.category}</p>
      <h1 className="mt-2 text-2xl font-bold md:text-3xl">{article.title}</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatDate(article.published_at)} · {article.author}
      </p>
      <p className="mt-6 text-base leading-relaxed whitespace-pre-line">{article.content}</p>
      <Button asChild size="sm" variant="outline" className="mt-8">
        <Link to="/news">كل الأخبار</Link>
      </Button>
    </SiteSection>
  );
}
