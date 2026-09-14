import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { EmptyState } from "@/components/ui-kit";
import { formatDate } from "@/lib/format";
import { siteContentQuery } from "@/lib/site.functions";

export const Route = createFileRoute("/_site/news/")({
  head: () => ({
    meta: [
      { title: "الأخبار | KemetRise" },
      { name: "description", content: "آخر أخبار وتحديثات KemetRise ومنتجاتها وشبكة وكلائها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "الأخبار | KemetRise" },
      { property: "og:description", content: "تحديثات المنتجات والشراكات والتوسعات." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  return (
    <>
      <SiteHero title="الأخبار" subtitle="آخر تحديثاتنا وإطلاقاتنا." />
      <SiteSection>
        {data.news.length === 0 ? (
          <EmptyState title="لا توجد أخبار منشورة بعد" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.news.map((n) => (
              <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }}>
                <SiteCard className="h-full">
                  <p className="text-xs text-primary">{n.category}</p>
                  <h2 className="mt-1 text-lg font-semibold">{n.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{n.excerpt}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {formatDate(n.published_at)} · {n.author}
                  </p>
                </SiteCard>
              </Link>
            ))}
          </div>
        )}
      </SiteSection>
    </>
  );
}
