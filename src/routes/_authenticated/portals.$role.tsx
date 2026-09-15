import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Handshake,
  Megaphone,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { EmptyState, LoadingState, PageHeader, SectionCard, StatusPill } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

type PortalKey = "partner" | "agent" | "vendor" | "provider" | "marketing";

type PortalConfig = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

const PORTALS: Record<PortalKey, PortalConfig> = {
  partner: {
    title: "بوابة الشريك",
    subtitle: "العملاء المحوّلون عبر الشراكة والطلبات الناتجة عنهم",
    icon: Handshake,
  },
  agent: {
    title: "بوابة الوكيل",
    subtitle: "عملاؤك وطلباتهم وحالة كل طلب في المنظومة",
    icon: Briefcase,
  },
  vendor: {
    title: "بوابة البائع",
    subtitle: "الأوامر المسندة إليك وخطوات التنفيذ المطلوبة",
    icon: Store,
  },
  provider: {
    title: "بوابة المزوّد",
    subtitle: "أوامر التوريد والخطوات التشغيلية المسندة إليك",
    icon: Wrench,
  },
  marketing: {
    title: "بوابة التسويق",
    subtitle: "العملاء المحتملون من الموقع ومصادر الحملات ورسائل الزوار",
    icon: Megaphone,
  },
};

export const Route = createFileRoute("/_authenticated/portals/$role")({
  head: () => ({
    meta: [
      { title: "بوابات الشركاء | KemetRise" },
      {
        name: "description",
        content: "لوحات تحكم مخصّصة للشركاء والوكلاء والبائعين والمزوّدين وفريق التسويق داخل KemetRise.",
      },
      { property: "og:title", content: "بوابات الشركاء | KemetRise" },
      { property: "og:description", content: "لوحة مخصّصة لكل نوع شريك داخل منظومة KemetRise." },
    ],
  }),
  component: PortalPage,
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold num">{value}</p>
    </div>
  );
}

function PortalPage() {
  const { role } = Route.useParams();
  const { userId } = useAuth();
  const key = (Object.keys(PORTALS) as PortalKey[]).includes(role as PortalKey)
    ? (role as PortalKey)
    : null;

  if (!key) {
    return (
      <EmptyState
        title="بوابة غير معروفة"
        description="اختر بوابة صحيحة من قائمة البوابات."
      />
    );
  }

  const cfg = PORTALS[key];

  return (
    <>
      <PageHeader
        title={cfg.title}
        subtitle={cfg.subtitle}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard">اللوحة المركزية</Link>
          </Button>
        }
      />
      {key === "marketing" ? <MarketingPortal /> : null}
      {key === "partner" || key === "agent" ? <SalesPortal userId={userId} /> : null}
      {key === "vendor" || key === "provider" ? <OperationsPortal userId={userId} /> : null}
    </>
  );
}

function MarketingPortal() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-marketing"],
    queryFn: async () => {
      const [leads, requests, messages] = await Promise.all([
        supabase
          .from("customers")
          .select("id,code,full_name,source,campaign,created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("sales_requests")
          .select("id,code,title,status,source,estimated_value,created_at")
          .eq("source", "website")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("website_contact_submissions")
          .select("id,full_name,inquiry_type,status,created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (leads.error) throw leads.error;
      if (requests.error) throw requests.error;
      if (messages.error) throw messages.error;
      return { leads: leads.data ?? [], requests: requests.data ?? [], messages: messages.data ?? [] };
    },
  });

  if (isLoading) return <LoadingState rows={5} />;

  const value = (data?.requests ?? []).reduce((s, r) => s + Number(r.estimated_value ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="عملاء محتملون" value={data?.leads.length ?? 0} />
        <Stat label="طلبات من الموقع" value={data?.requests.length ?? 0} />
        <Stat label="القيمة التقديرية" value={formatCurrency(value)} />
      </div>
      <SectionCard title="أحدث طلبات الموقع">
        {(data?.requests ?? []).length === 0 ? (
          <EmptyState title="لا توجد طلبات" description="طلبات الموقع تظهر هنا فور وصولها." />
        ) : (
          <ul className="divide-y divide-border">
            {data!.requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground num">
                    {r.code} · {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill label={r.status} />
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/requests/$id" params={{ id: r.id }}>
                      فتح
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <SectionCard title="رسائل الزوار">
        {(data?.messages ?? []).length === 0 ? (
          <EmptyState title="لا توجد رسائل" description="رسائل نموذج التواصل تظهر هنا." />
        ) : (
          <ul className="divide-y divide-border">
            {data!.messages.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate">
                  {m.full_name} · <span className="text-muted-foreground">{m.inquiry_type}</span>
                </span>
                <StatusPill label={m.status} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function SalesPortal({ userId }: { userId: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-sales", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [customers, requests] = await Promise.all([
        supabase
          .from("customers")
          .select("id,code,full_name,status,created_at")
          .eq("assigned_to", userId!)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("sales_requests")
          .select("id,code,title,status,estimated_value,created_at")
          .eq("salesperson_id", userId!)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (customers.error) throw customers.error;
      if (requests.error) throw requests.error;
      return { customers: customers.data ?? [], requests: requests.data ?? [] };
    },
  });

  if (isLoading) return <LoadingState rows={5} />;

  const value = (data?.requests ?? []).reduce((s, r) => s + Number(r.estimated_value ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="العملاء" value={data?.customers.length ?? 0} />
        <Stat label="الطلبات" value={data?.requests.length ?? 0} />
        <Stat label="القيمة التقديرية" value={formatCurrency(value)} />
      </div>
      <SectionCard title="طلباتك">
        {(data?.requests ?? []).length === 0 ? (
          <EmptyState title="لا توجد طلبات" description="الطلبات المسندة إليك تظهر هنا." />
        ) : (
          <ul className="divide-y divide-border">
            {data!.requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground num">
                    {r.code} · {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill label={r.status} />
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/requests/$id" params={{ id: r.id }}>
                      فتح
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <SectionCard title="عملاؤك">
        {(data?.customers ?? []).length === 0 ? (
          <EmptyState title="لا يوجد عملاء" description="العملاء المسندون إليك يظهرون هنا." />
        ) : (
          <ul className="divide-y divide-border">
            {data!.customers.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link to="/customers/$id" params={{ id: c.id }} className="truncate hover:underline">
                  {c.full_name} <span className="num text-muted-foreground">{c.code}</span>
                </Link>
                <StatusPill label={c.status} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function OperationsPortal({ userId }: { userId: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-ops", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [orders, steps] = await Promise.all([
        supabase
          .from("orders")
          .select("id,code,title,status,expected_delivery,created_at")
          .eq("assigned_to", userId!)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("order_execution_steps")
          .select("id,order_id,name,status,planned_end,delay_days")
          .eq("assigned_to", userId!)
          .order("planned_end", { ascending: true })
          .limit(30),
      ]);
      if (orders.error) throw orders.error;
      if (steps.error) throw steps.error;
      return { orders: orders.data ?? [], steps: steps.data ?? [] };
    },
  });

  if (isLoading) return <LoadingState rows={5} />;

  const late = (data?.steps ?? []).filter((s) => Number(s.delay_days ?? 0) > 0).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="أوامر مسندة إليك" value={data?.orders.length ?? 0} />
        <Stat label="خطوات تنفيذ" value={data?.steps.length ?? 0} />
        <Stat label="خطوات متأخرة" value={late} />
      </div>
      <SectionCard title="أوامرك">
        {(data?.orders ?? []).length === 0 ? (
          <EmptyState title="لا توجد أوامر" description="الأوامر المسندة إليك تظهر هنا." />
        ) : (
          <ul className="divide-y divide-border">
            {data!.orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground num">
                    {o.code} · {o.expected_delivery ? formatDate(o.expected_delivery) : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill label={o.status} />
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/orders/$id" params={{ id: o.id }}>
                      فتح
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <SectionCard title="خطوات التنفيذ">
        {(data?.steps ?? []).length === 0 ? (
          <EmptyState title="لا توجد خطوات" description="خطوات التنفيذ المسندة إليك تظهر هنا." />
        ) : (
          <ul className="divide-y divide-border">
            {data!.steps.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link to="/orders/$id" params={{ id: s.order_id }} className="truncate hover:underline">
                  {s.name}
                </Link>
                <span className="flex items-center gap-2">
                  {Number(s.delay_days ?? 0) > 0 ? (
                    <StatusPill label={`تأخير ${s.delay_days} يوم`} tone="danger" />
                  ) : null}
                  <StatusPill label={s.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
