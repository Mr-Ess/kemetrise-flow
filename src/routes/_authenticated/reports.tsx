import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { LEAD_SOURCES, LOST_REASONS, REQUEST_STATUS } from "@/lib/constants";
import { egp, num, pct } from "@/lib/format";
import {
  ErrorState,
  KpiCard,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير | KemetRise" },
      { name: "description", content: "تقارير المبيعات والتحويل ومصادر العملاء والتحصيل." },
      { property: "og:title", content: "التقارير | KemetRise" },
      { property: "og:description", content: "تحليلات أداء المبيعات في KemetRise." },
    ],
  }),
  component: ReportsPage,
});

const COLORS = ["#e8863a", "#4a9edd", "#59c08a", "#e0b549", "#d4685f", "#9b8ade", "#6fb7c9"];

function ReportsPage() {
  const { canSeeCosts } = useAuth();
  const [months, setMonths] = useState(6);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [requests, orders, payments, customers, costings] = await Promise.all([
        supabase.from("sales_requests").select("id, status, created_at, estimated_value, lost_reason"),
        supabase.from("orders").select("id, status, created_at, total_price, request_id"),
        supabase.from("payments").select("amount, payment_date, method").eq("is_void", false),
        supabase.from("customers").select("id, source, created_at, status"),
        supabase.from("costings").select("total_cost, suggested_price, approved_price, request_id"),
      ]);
      if (requests.error) throw requests.error;
      return {
        requests: requests.data ?? [],
        orders: orders.data ?? [],
        payments: payments.data ?? [],
        customers: customers.data ?? [],
        costings: costings.data ?? [],
      };
    },
  });

  const monthly = useMemo(() => {
    if (!data) return [];
    const out: { month: string; requests: number; orders: number; sales: number; collected: number }[] =
      [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("ar-EG", { month: "short", year: "2-digit" }).format(d);
      out.push({
        month: label,
        requests: data.requests.filter((r) => r.created_at.slice(0, 7) === key).length,
        orders: data.orders.filter((o) => o.created_at.slice(0, 7) === key).length,
        sales: data.orders
          .filter((o) => o.created_at.slice(0, 7) === key)
          .reduce((s, o) => s + Number(o.total_price), 0),
        collected: data.payments
          .filter((p) => p.payment_date.slice(0, 7) === key)
          .reduce((s, p) => s + Number(p.amount), 0),
      });
    }
    return out;
  }, [data, months]);

  const sources = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.customers.forEach((c) => map.set(c.source, (map.get(c.source) ?? 0) + 1));
    return [...map.entries()].map(([k, v]) => ({ name: LEAD_SOURCES[k] ?? k, value: v }));
  }, [data]);

  const statuses = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.requests.forEach((r) => map.set(r.status, (map.get(r.status) ?? 0) + 1));
    return [...map.entries()].map(([k, v]) => ({
      name: REQUEST_STATUS[k]?.label ?? k,
      value: v,
    }));
  }, [data]);

  const lost = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.requests
      .filter((r) => r.lost_reason)
      .forEach((r) => map.set(r.lost_reason!, (map.get(r.lost_reason!) ?? 0) + 1));
    return [...map.entries()].map(([k, v]) => ({ name: LOST_REASONS[k] ?? k, value: v }));
  }, [data]);

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isLoading || !data) return <LoadingState rows={6} />;

  const won = data.requests.filter((r) =>
    ["customer_approved", "converted_to_order"].includes(r.status),
  ).length;
  const closed = data.requests.filter((r) =>
    ["customer_approved", "converted_to_order", "customer_rejected", "expired", "cancelled"].includes(
      r.status,
    ),
  ).length;
  const conversion = closed ? (won / closed) * 100 : 0;
  const totalSales = data.orders.reduce((s, o) => s + Number(o.total_price), 0);
  const collected = data.payments.reduce((s, p) => s + Number(p.amount), 0);
  const avgOrder = data.orders.length ? totalSales / data.orders.length : 0;

  const costed = data.costings.filter((c) => Number(c.suggested_price) > 0);
  const avgMargin = costed.length
    ? costed.reduce((s, c) => {
        const price = Number(c.approved_price ?? c.suggested_price);
        return s + (price ? ((price - Number(c.total_cost)) / price) * 100 : 0);
      }, 0) / costed.length
    : 0;

  return (
    <>
      <PageHeader
        title="التقارير"
        subtitle="أداء المبيعات والتحصيل ومصادر العملاء"
        actions={
          <div className="flex gap-2">
            {[3, 6, 12].map((m) => (
              <Button
                key={m}
                size="sm"
                variant={months === m ? "default" : "outline"}
                onClick={() => setMonths(m)}
              >
                {m} شهور
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="إجمالي الطلبات" value={num(data.requests.length)} tone="info" />
        <KpiCard label="نسبة التحويل" value={pct(conversion)} tone="success" />
        <KpiCard label="إجمالي المبيعات" value={egp(totalSales)} tone="primary" />
        <KpiCard label="إجمالي المحصّل" value={egp(collected)} tone="success" />
        <KpiCard label="متوسط قيمة الأمر" value={egp(avgOrder)} tone="info" />
        {canSeeCosts ? (
          <KpiCard label="متوسط هامش الربح" value={pct(avgMargin)} tone="warning" />
        ) : (
          <KpiCard label="عدد العملاء" value={num(data.customers.length)} />
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="المبيعات والتحصيل شهريًا">
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="#9a948c" fontSize={12} />
                <YAxis stroke="#9a948c" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#1f1d1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => egp(v)}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" name="مبيعات" stroke="#e8863a" strokeWidth={2} />
                <Line
                  type="monotone"
                  dataKey="collected"
                  name="تحصيل"
                  stroke="#59c08a"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="عدد الطلبات والأوامر شهريًا">
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="#9a948c" fontSize={12} />
                <YAxis stroke="#9a948c" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1f1d1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey="requests" name="طلبات" fill="#4a9edd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="orders" name="أوامر" fill="#e8863a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="مصادر العملاء">
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sources} dataKey="value" nameKey="name" outerRadius={95} label>
                  {sources.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1f1d1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="توزيع حالات الطلبات">
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statuses} layout="vertical" margin={{ left: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" stroke="#9a948c" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#9a948c" fontSize={11} width={90} />
                <Tooltip
                  contentStyle={{
                    background: "#1f1d1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="value" name="عدد" fill="#e8863a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {lost.length > 0 ? (
          <SectionCard title="أسباب فقد الطلبات" className="lg:col-span-2">
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lost}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="#9a948c" fontSize={11} />
                  <YAxis stroke="#9a948c" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1f1d1a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="value" name="عدد" fill="#d4685f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </>
  );
}
