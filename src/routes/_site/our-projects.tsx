import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui-kit";
import { siteContentQuery } from "@/lib/site.functions";

const STATUS: Record<string, string> = {
  completed: "مكتمل",
  in_progress: "قيد التنفيذ",
  planned: "مخطط",
};

export const Route = createFileRoute("/_site/our-projects")({
  head: () => ({
    meta: [
      { title: "مشاريعنا | KemetRise" },
      {
        name: "description",
        content: "مشاريع KemetRise المنفذة والجارية في قطاعات التجزئة والصناعة والخدمات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "مشاريعنا | KemetRise" },
      { property: "og:description", content: "نماذج من المشاريع المنفذة والجارية." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  return (
    <>
      <SiteHero title="مشاريعنا" subtitle="نماذج من أعمال نفذناها لعملائنا في قطاعات مختلفة." />
      <SiteSection>
        {data.projects.length === 0 ? (
          <EmptyState title="لا توجد مشاريع منشورة بعد" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((p) => (
              <SiteCard key={p.id} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-primary">{p.sector}</p>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {STATUS[p.status] ?? p.status}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-semibold">{p.title}</h2>
                <p className="text-xs text-muted-foreground">{p.client_name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                <Button asChild size="sm" variant="outline" className="mt-4 self-start">
                  <Link
                    to="/request"
                    search={{ service: undefined, product: undefined, plan: undefined }}
                  >
                    اطلب مشروعًا مشابهًا
                  </Link>
                </Button>
              </SiteCard>
            ))}
          </div>
        )}
      </SiteSection>
    </>
  );
}
