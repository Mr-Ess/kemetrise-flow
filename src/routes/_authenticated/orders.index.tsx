import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS } from "@/lib/constants";
import { egp, formatDate, num } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  PageHeader,
  StatusPill,
} from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/orders/")({
  head: () => ({
    meta: [
      { title: "أوامر التنفيذ | KemetRise" },
      { name: "description", content: "أوامر التنفيذ وحالتها ومواعيد التسليم والمتحصل منها." },
      { property: "og:title", content: "أوامر التنفيذ | KemetRise" },
      { property: "og:description", content: "متابعة تنفيذ وتسليم الأوامر في KemetRise." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const [orders, financials] = await Promise.all([
        supabase
          .from("orders")
          .select("*, customers(full_name, phone)")
          .order("created_at", { ascending: false }),
        supabase.from("order_financials").select("*"),
      ]);
      if (orders.error) throw orders.error;
      const paidMap = new Map(
        (financials.data ?? []).map((f) => [f.order_id, Number(f.paid_amount ?? 0)]),
      );
      return (orders.data ?? []).map((o) => ({ ...o, paid: paidMap.get(o.id) ?? 0 }));
    },
  });

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (data ?? []).filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!t) return true;
      const cust = (o.customers as { full_name: string } | null)?.full_name ?? "";
      return [o.code, o.title, cust].some((v) => String(v).toLowerCase().includes(t));
    });
  }, [data, term, status]);

  const today = new Date().toISOString().slice(0, 10);
  const active = (data ?? []).filter(
    (o) => !["completed", "cancelled", "delivered"].includes(o.status),
  );
  const late = active.filter((o) => o.expected_delivery && o.expected_delivery < today);
  const outstanding = (data ?? []).reduce(
    (s, o) => s + (Number(o.total_price) - Number(o.paid)),
    0,
  );

  return (
    <>
      <PageHeader title="أوامر التنفيذ" subtitle={`${rows.length} أمر`} />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="أوامر نشطة" value={num(active.length)} tone="primary" />
        <KpiCard label="متأخرة عن التسليم" value={num(late.length)} tone="danger" />
        <KpiCard
          label="إجمالي القيمة"
          value={egp((data ?? []).reduce((s, o) => s + Number(o.total_price), 0))}
          tone="info"
        />
        <KpiCard label="متبقي للتحصيل" value={egp(outstanding)} tone="warning" />
      </div>

      <div className="panel mb-4 grid gap-3 p-4 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="ابحث بالكود أو العنوان أو العميل"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {Object.entries(ORDER_STATUS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}
      {data && rows.length === 0 ? <EmptyState title="لا توجد أوامر مطابقة" /> : null}

      {rows.length > 0 ? (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-right text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">الكود</th>
                <th className="px-4 py-3 font-medium">الأمر</th>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">القيمة</th>
                <th className="px-4 py-3 font-medium">المحصّل</th>
                <th className="px-4 py-3 font-medium">المتبقي</th>
                <th className="px-4 py-3 font-medium">التسليم</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => {
                const remaining = Number(o.total_price) - Number(o.paid);
                const isLate =
                  o.expected_delivery &&
                  o.expected_delivery < today &&
                  !["completed", "delivered", "cancelled"].includes(o.status);
                return (
                  <tr key={o.id} className="hover:bg-muted/40">
                    <td className="num px-4 py-3 text-xs text-muted-foreground">{o.code}</td>
                    <td className="px-4 py-3">
                      <Link
                        to="/orders/$id"
                        params={{ id: o.id }}
                        className="font-medium hover:text-primary"
                      >
                        {o.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {(o.customers as { full_name: string } | null)?.full_name ?? "—"}
                    </td>
                    <td className="num px-4 py-3">{egp(Number(o.total_price))}</td>
                    <td className="num px-4 py-3 text-success">{egp(Number(o.paid))}</td>
                    <td className={`num px-4 py-3 ${remaining > 0 ? "text-destructive" : ""}`}>
                      {egp(remaining)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {formatDate(o.expected_delivery)}
                      {isLate ? <span className="mr-2 text-destructive">متأخر</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={ORDER_STATUS[o.status]?.label ?? o.status}
                        tone={ORDER_STATUS[o.status]?.tone}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
