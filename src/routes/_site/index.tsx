import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Quote, Star } from "lucide-react";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteContentQuery } from "@/lib/site.functions";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "KemetRise | منظومة أعمال متكاملة من الطلب حتى التسليم" },
      {
        name: "description",
        content:
          "KemetRise تجمع الموقع وبوابة العميل ونظام المبيعات والتشغيل في منظومة واحدة: خدمات، منتجات، مشاريع، ومتابعة كاملة حتى التحصيل.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "KemetRise | منظومة أعمال متكاملة" },
      {
        property: "og:description",
        content: "خدمات ومنتجات ومشاريع مع بوابة عميل ونظام تشغيل داخلي موحّد.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  const hero = data.hero;

  return (
    <>
      <SiteHero
        badge={hero?.badge ?? "KemetRise"}
        title={hero?.title ?? "نظام تشغيل أعمالك في مكان واحد"}
        subtitle={hero?.subtitle}
        actions={
          <>
            <Button asChild size="lg">
              <Link
                to="/request"
                search={{ service: undefined, product: undefined, plan: undefined }}
              >
                {hero?.primary_cta_label ?? "ابدأ الآن"}
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/services">{hero?.secondary_cta_label ?? "استكشف خدماتنا"}</Link>
            </Button>
          </>
        }
      />

      {data.stats.length ? (
        <div className="border-b border-border/60 bg-card/30">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
            {data.stats.map((s) => (
              <div key={s.id} className="text-center">
                <p className="num text-2xl font-bold text-primary md:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {data.features.length ? (
        <SiteSection title="لماذا KemetRise" description="منظومة واحدة بدل أدوات متفرقة">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.features.map((f) => (
              <SiteCard key={f.id}>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </SiteCard>
            ))}
          </div>
        </SiteSection>
      ) : null}

      {data.services.length ? (
        <SiteSection
          title="خدماتنا"
          description="حلول متكاملة تغطي التصميم والتقنية والإنتاج والتسويق"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.services.slice(0, 6).map((s) => (
              <SiteCard key={s.id}>
                <p className="text-xs text-primary">{s.category}</p>
                <h3 className="mt-1 font-semibold">{s.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                <Button asChild size="sm" variant="ghost" className="mt-3 px-0">
                  <Link to="/request" search={{ service: s.slug, product: undefined, plan: undefined }}>
                    اطلب هذه الخدمة
                  </Link>
                </Button>
              </SiteCard>
            ))}
          </div>
          <div className="mt-6">
            <Button asChild variant="outline" size="sm">
              <Link to="/services">كل الخدمات</Link>
            </Button>
          </div>
        </SiteSection>
      ) : null}

      {data.how.length ? (
        <SiteSection title="كيف نعمل" description="أربع خطوات واضحة من الطلب حتى التسليم">
          <div className="grid gap-4 md:grid-cols-4">
            {data.how.map((h) => (
              <SiteCard key={h.id}>
                <span className="num inline-flex size-8 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
                  {h.step_no}
                </span>
                <h3 className="mt-3 font-semibold">{h.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{h.description}</p>
              </SiteCard>
            ))}
          </div>
        </SiteSection>
      ) : null}

      {data.projects.length ? (
        <SiteSection title="مشاريع مختارة">
          <div className="grid gap-4 md:grid-cols-3">
            {data.projects.slice(0, 3).map((p) => (
              <SiteCard key={p.id}>
                <p className="text-xs text-primary">{p.sector}</p>
                <h3 className="mt-1 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
              </SiteCard>
            ))}
          </div>
          <div className="mt-6">
            <Button asChild variant="outline" size="sm">
              <Link to="/our-projects">كل المشاريع</Link>
            </Button>
          </div>
        </SiteSection>
      ) : null}

      {data.testimonials.length ? (
        <SiteSection title="آراء عملائنا">
          <div className="grid gap-4 md:grid-cols-2">
            {data.testimonials.map((t) => (
              <SiteCard key={t.id}>
                <Quote className="size-5 text-primary" />
                <p className="mt-3 text-sm">{t.quote}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{t.author_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.author_title} — {t.company}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </SiteCard>
            ))}
          </div>
        </SiteSection>
      ) : null}

      {data.faqs.length ? (
        <SiteSection title="أسئلة شائعة">
          <Accordion type="single" collapsible className="rounded-xl border border-border/70 px-4">
            {data.faqs.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="text-right text-sm">{f.question}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SiteSection>
      ) : null}

      <SiteSection>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold">جاهز تبدأ؟</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            أرسل طلبك الآن وتابع كل خطوة من بوابة العميل.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link to="/request" search={{ service: undefined, product: undefined, plan: undefined }}>
              اطلب الآن
            </Link>
          </Button>
        </div>
      </SiteSection>
    </>
  );
}
