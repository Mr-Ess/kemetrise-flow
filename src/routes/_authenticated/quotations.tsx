import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { QUOTATION_STATUS } from "@/lib/constants";
import { egp, formatDate } from "@/lib/format";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusPill } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/quotations")({
  head: () => ({
    meta: [
      { title: "عروض الأسعار | KemetRise" },
      { name: "description", content: "كل عروض الأسعار وإصداراتها وحالتها وصلاحيتها." },
      { property: "og:title", content: "عروض الأسعار | KemetRise" },
      { property: "og:description", content: "متابعة عروض الأسعار والتفاوض في KemetRise." },
    ],
  }),
  component: QuotationsPage,
});

function QuotationsPage() {
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [onlyCurrent, setOnlyCurrent] = useState(true);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select(
          "id, code, version, is_current, status, selling_price, discount, tax, total, valid_until, created_at, request_id, customers(full_name), sales_requests(title)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (data ?? []).filter((q) => {
      if (onlyCurrent && !q.is_current) return false;
      if (status !== "all" && q.status !== status) return false;
      if (!t) return true;
      const cust = (q.customers as { full_name: string } | null)?.full_name ?? "";
      const title = (q.sales_requests as { title: string } | null)?.title ?? "";
      return [q.code, cust, title].some((v) => String(v).toLowerCase().includes(t));
    });
  }, [data, term, status, onlyCurrent]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="عروض الأسعار" subtitle={`${rows.length} عرض`} />

      <div className="panel mb-4 grid gap-3 p-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="ابحث بالكود أو العميل"
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
            {Object.entries(QUOTATION_STATUS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setOnlyCurrent((v) => !v)}>
          {onlyCurrent ? "عرض كل الإصدارات" : "الإصدارات الحالية فقط"}
        </Button>
      </div>

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}
      {data && rows.length === 0 ? <EmptyState title="لا توجد عروض مطابقة" /> : null}

      {rows.length > 0 ? (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-right text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">الكود</th>
                <th className="px-4 py-3 font-medium">الإصدار</th>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">الطلب</th>
                <th className="px-4 py-3 font-medium">الإجمالي</th>
                <th className="px-4 py-3 font-medium">صالح حتى</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((q) => {
                const expired =
                  q.valid_until &&
                  q.valid_until < today &&
                  !["accepted", "rejected", "superseded"].includes(q.status);
                return (
                  <tr key={q.id} className="hover:bg-muted/40">
                    <td className="num px-4 py-3 text-xs text-muted-foreground">{q.code}</td>
                    <td className="num px-4 py-3">{q.version}</td>
                    <td className="px-4 py-3">
                      {(q.customers as { full_name: string } | null)?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {(q.sales_requests as { title: string } | null)?.title ?? "—"}
                    </td>
                    <td className="num px-4 py-3 font-semibold">{egp(Number(q.total))}</td>
                    <td className="px-4 py-3 text-xs">
                      {formatDate(q.valid_until)}
                      {expired ? (
                        <span className="mr-2 text-destructive">منتهي</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={QUOTATION_STATUS[q.status]?.label ?? q.status}
                        tone={QUOTATION_STATUS[q.status]?.tone}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/requests/$id" params={{ id: q.request_id }}>
                          فتح الطلب
                        </Link>
                      </Button>
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
