import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { EmptyState } from "@/components/ui-kit";
import { siteContentQuery } from "@/lib/site.functions";

export const Route = createFileRoute("/_site/portfolio")({
  head: () => ({
    meta: [
      { title: "أعمالنا السابقة | KemetRise" },
      {
        name: "description",
        content: "نماذج من أعمال KemetRise السابقة والنتائج التي حققتها لعملائنا.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "أعمالنا السابقة | KemetRise" },
      { property: "og:description", content: "أعمال سابقة ونتائج قابلة للقياس." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  return (
    <>
      <SiteHero title="أعمالنا السابقة" subtitle="نتائج حقيقية من تنفيذ فعلي." />
      <SiteSection>
        {data.portfolio.length === 0 ? (
          <EmptyState title="لا توجد أعمال منشورة بعد" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.portfolio.map((w) => (
              <SiteCard key={w.id}>
                <p className="text-xs text-primary">{w.category}</p>
                <h2 className="mt-1 text-lg font-semibold">{w.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{w.description}</p>
                {w.results ? (
                  <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                    {w.results}
                  </p>
                ) : null}
              </SiteCard>
            ))}
          </div>
        )}
      </SiteSection>
    </>
  );
}
