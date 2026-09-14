import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone } from "lucide-react";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { EmptyState } from "@/components/ui-kit";
import { siteContentQuery } from "@/lib/site.functions";

export const Route = createFileRoute("/_site/our-agents")({
  head: () => ({
    meta: [
      { title: "وكلاؤنا | KemetRise" },
      {
        name: "description",
        content: "وكلاء KemetRise المعتمدون ومناطق التغطية داخل مصر والخليج.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "وكلاؤنا | KemetRise" },
      { property: "og:description", content: "شبكة وكلاء معتمدين لخدمتك في منطقتك." },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  return (
    <>
      <SiteHero title="وكلاؤنا" subtitle="أقرب وكيل معتمد لخدمتك في منطقتك." />
      <SiteSection>
        {data.agents.length === 0 ? (
          <EmptyState title="لا يوجد وكلاء منشورون بعد" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.agents.map((a) => (
              <SiteCard key={a.id}>
                <h2 className="text-lg font-semibold">{a.name}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-primary">
                  <MapPin className="size-3.5" />
                  {a.region} — {a.country}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{a.bio}</p>
                <p className="mt-2 text-xs text-muted-foreground">التغطية: {a.coverage}</p>
                <div className="mt-3 space-y-1 text-sm">
                  {a.phone ? (
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-muted-foreground" />
                      <span className="num">{a.phone}</span>
                    </p>
                  ) : null}
                  {a.email ? (
                    <p className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {a.email}
                    </p>
                  ) : null}
                </div>
              </SiteCard>
            ))}
          </div>
        )}
      </SiteSection>
    </>
  );
}
