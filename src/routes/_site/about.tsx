import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { EmptyState } from "@/components/ui-kit";
import { siteContentQuery } from "@/lib/site.functions";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "من نحن | KemetRise" },
      {
        name: "description",
        content: "قصة KemetRise ورسالتها ورؤيتها وفريق القيادة الذي يقود التنفيذ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "من نحن | KemetRise" },
      { property: "og:description", content: "رسالتنا ورؤيتنا وفريق القيادة." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  return (
    <>
      <SiteHero title="من نحن" subtitle={data.settings?.tagline} />
      <SiteSection>
        {data.about.length === 0 ? (
          <EmptyState title="لا يوجد محتوى منشور بعد" />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {data.about.map((s) => (
              <SiteCard key={s.id}>
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </SiteCard>
            ))}
          </div>
        )}
      </SiteSection>

      {data.team.length ? (
        <SiteSection title="فريق القيادة">
          <div className="grid gap-4 md:grid-cols-3">
            {data.team.map((m) => (
              <SiteCard key={m.id}>
                <h3 className="font-semibold">{m.name}</h3>
                <p className="text-xs text-primary">{m.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{m.bio}</p>
              </SiteCard>
            ))}
          </div>
        </SiteSection>
      ) : null}
    </>
  );
}
