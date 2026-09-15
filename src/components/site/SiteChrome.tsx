import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { SiteContent } from "@/lib/site.functions";
import { cn } from "@/lib/utils";

export const SITE_NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/services", label: "خدماتنا" },
  { to: "/products", label: "منتجاتنا" },
  { to: "/our-projects", label: "مشاريعنا" },
  { to: "/portfolio", label: "أعمالنا" },
  { to: "/pricing", label: "باقاتنا" },
  { to: "/about", label: "من نحن" },
  { to: "/partners", label: "شركاؤنا" },
  { to: "/our-agents", label: "وكلاؤنا" },
  { to: "/news", label: "الأخبار" },
  { to: "/contact", label: "تواصل معنا" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="shrink-0">
          <BrandMark />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          {SITE_NAV.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              activeOptions={{ exact: i.to === "/" }}
              activeProps={{ className: "text-primary bg-accent/60" }}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2 xl:ms-0">
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link to="/portal">بوابة العميل</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/request" search={{ service: undefined, product: undefined, plan: undefined }}>
              اطلب الآن
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="القائمة">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto">
              <SheetTitle className="mb-4">القائمة</SheetTitle>
              <ul className="space-y-1">
                {SITE_NAV.map((i) => (
                  <li key={i.to}>
                    <Link
                      to={i.to}
                      onClick={() => setOpen(false)}
                      activeOptions={{ exact: i.to === "/" }}
                      activeProps={{ className: "text-primary font-semibold" }}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link
                    to="/portal"
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    بوابة العميل
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                  >
                    دخول الفريق
                  </Link>
                </li>
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ settings }: { settings: SiteContent["settings"] }) {
  return (
    <footer className="mt-20 border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <BrandMark />
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            {settings?.tagline ?? "منظومة أعمال متكاملة."}
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">روابط</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {SITE_NAV.slice(1, 7).map((i) => (
              <li key={i.to}>
                <Link to={i.to} className="hover:text-foreground">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">تواصل</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {settings?.phone ? <li className="num">{settings.phone}</li> : null}
            {settings?.email ? <li>{settings.email}</li> : null}
            {settings?.address ? <li>{settings.address}</li> : null}
            <li>
              <Link to="/auth" className="hover:text-foreground">
                دخول الفريق
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        {settings?.footer_text ?? "© KemetRise"}
      </div>
    </footer>
  );
}

export function SiteHero({
  title,
  subtitle,
  badge,
  actions,
}: {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_0%,hsl(var(--primary)/0.18),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        {badge ? (
          <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {badge}
          </span>
        ) : null}
        <h1 className="mt-4 max-w-3xl text-3xl leading-tight font-bold md:text-5xl">{title}</h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{subtitle}</p>
        ) : null}
        {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function SiteSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto max-w-7xl px-4 py-12", className)}>
      {title ? (
        <div className="mb-6">
          <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function SiteCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/40",
        className,
      )}
    >
      {children}
    </div>
  );
}
