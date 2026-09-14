import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  Calculator,
  ClipboardList,
  FileText,
  Plus,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { egp, num, formatDate, age } from "@/lib/format";
import { REQUEST_STATUS, ORDER_STATUS } from "@/lib/constants";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | KemetRise" },
      {
        name: "description",
        content: "مؤشرات الأداء اليومية لعملاء وطلبات وأوامر ومدفوعات KemetRise.",
      },
      { property: "og:title", content: "لوحة التحكم | KemetRise" },
      { property: "og:description", content: "مؤشرات الأداء اليومية لفريق KemetRise." },
    ],
  }),
  component: DashboardPage,
});

async function loadDashboard() {
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [customers, newCustomers, requests, orders, payments] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("is_archived", false),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthAgo),
    supabase.from("sales_requests").select("id, code, title, status, estimated_value, created_at, status_changed_at, customers(full_name)").order("created_at", { ascending: false }),
    supabase.from("orders").select("id, code, title, status, total_price, expected_delivery, customers(full_name)").order("created_at", { ascending: false }),
    supabase.from("payments").select("amount").eq("is_void", false),
  ]);

  if (requests.error) throw requests.error;
  if (orders.error) throw orders.error;

  const reqRows = requests.data ?? [];
  const orderRows = orders.data ?? [];
  const openStatuses = [
    "submitted",
    "under_review",
    "waiting_information",
    "costing_in_progress",
    "costing_completed",
    "pending_approval",
    "quotation_ready",
    "quotation_sent",
    "negotiation",
  ];
  const today = new Date().toISOString().slice(0, 10);

  const totalSales = orderRows.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
  const totalPaid = (payments.data ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0);

  return {
    totalCustomers: customers.count ?? 0,
    newCustomers: newCustomers.count ?? 0,
    openRequests: reqRows.filter((r) => openStatuses.includes(r.status)).length,
    waitingCosting: reqRows.filter((r) => r.status === "costing_in_progress").length,
    waitingApproval: reqRows.filter((r) => r.status === "pending_approval").length,
    quotationsSent: reqRows.filter((r) => ["quotation_sent", "negotiation"].includes(r.status)).length,
    openOrders: orderRows.filter(
      (o) => !["completed", "cancelled", "delivered"].includes(o.status),
    ).length,
    overdueOrders: orderRows.filter(
      (o) =>
        o.expected_delivery &&
        o.expected_delivery < today &&
        !["completed", "delivered", "cancelled"].includes(o.status),
    ).length,
    pipelineValue: reqRows
      .filter((r) => openStatuses.includes(r.status))
      .reduce((s, r) => s + Number(r.estimated_value ?? 0), 0),
    totalSales,
    totalPaid,
    outstanding: totalSales - totalPaid,
    recentRequests: reqRows.slice(0, 6),
    recentOrders: orderRows.slice(0, 6),
  };
}

function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: loadDashboard,
  });

  return (
    <>
      <PageHeader
        title="لوحة التحكم"
        subtitle="نظرة شاملة على دورة العمل من الطلب حتى التحصيل"
        actions={
          <>
            <Button asChild size="sm">
              <Link to="/requests/new">
                <Plus className="size-4" />
                طلب بيع جديد
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/customers">
                <UserPlus className="size-4" />
                عميل جديد
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/payments">
                <Receipt className="size-4" />
                تسجيل دفعة
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/tasks">
                <ClipboardList className="size-4" />
                متابعة جديدة
              </Link>
            </Button>
          </>
        }
      />

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState rows={4} /> : null}

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="إجمالي العملاء" value={num(data.totalCustomers)} icon={Users} tone="info" to="/customers" />
            <KpiCard label="عملاء جدد (30 يوم)" value={num(data.newCustomers)} icon={UserPlus} tone="success" />
            <KpiCard label="طلبات مفتوحة" value={num(data.openRequests)} icon={ClipboardList} tone="primary" to="/requests" />
            <KpiCard label="بانتظار التسعير" value={num(data.waitingCosting)} icon={Calculator} tone="warning" to="/costing" />
            <KpiCard label="بانتظار الاعتماد" value={num(data.waitingApproval)} icon={ShieldCheck} tone="warning" to="/approvals" />
            <KpiCard label="عروض مُرسلة" value={num(data.quotationsSent)} icon={FileText} tone="info" to="/quotations" />
            <KpiCard label="أوامر مفتوحة" value={num(data.openOrders)} icon={ShoppingCart} tone="primary" to="/orders" />
            <KpiCard label="أوامر متأخرة" value={num(data.overdueOrders)} icon={ShoppingCart} tone="danger" to="/orders" />
            <KpiCard label="قيمة خط السير" value={egp(data.pipelineValue)} icon={TrendingUp} tone="info" to="/pipeline" />
            <KpiCard label="إجمالي المبيعات" value={egp(data.totalSales)} icon={BadgeDollarSign} tone="success" />
            <KpiCard label="إجمالي المحصّل" value={egp(data.totalPaid)} icon={Wallet} tone="success" to="/payments" />
            <KpiCard label="المتبقي للتحصيل" value={egp(data.outstanding)} icon={Receipt} tone="danger" to="/payments" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="أحدث طلبات البيع"
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/requests">عرض الكل</Link>
                </Button>
              }
            >
              {data.recentRequests.length === 0 ? (
                <EmptyState title="لا توجد طلبات بعد" description="ابدأ بإنشاء أول طلب بيع." />
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentRequests.map((r) => (
                    <li key={r.id}>
                      <Link
                        to="/requests/$id"
                        params={{ id: r.id }}
                        className="flex items-center justify-between gap-3 py-3 hover:text-primary"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="num">{r.code}</span> ·{" "}
                            {(r.customers as { full_name: string } | null)?.full_name} · منذ {age(r.created_at)}
                          </p>
                        </div>
                        <StatusPill
                          label={REQUEST_STATUS[r.status]?.label ?? r.status}
                          tone={REQUEST_STATUS[r.status]?.tone}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="أحدث الأوامر"
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/orders">عرض الكل</Link>
                </Button>
              }
            >
              {data.recentOrders.length === 0 ? (
                <EmptyState title="لا توجد أوامر بعد" description="الأوامر تُنشأ من الطلبات المقبولة." />
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentOrders.map((o) => (
                    <li key={o.id}>
                      <Link
                        to="/orders/$id"
                        params={{ id: o.id }}
                        className="flex items-center justify-between gap-3 py-3 hover:text-primary"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{o.title}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="num">{o.code}</span> · تسليم {formatDate(o.expected_delivery)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="num text-sm font-semibold">{egp(Number(o.total_price))}</span>
                          <StatusPill
                            label={ORDER_STATUS[o.status]?.label ?? o.status}
                            tone={ORDER_STATUS[o.status]?.tone}
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      ) : null}
    </>
  );
}
