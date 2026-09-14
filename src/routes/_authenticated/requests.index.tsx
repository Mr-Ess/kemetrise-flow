import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PRIORITY, REQUEST_STATUS } from "@/lib/constants";
import { age, egp } from "@/lib/format";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusPill } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/requests/")({
  head: () => ({
    meta: [
      { title: "طلبات البيع | KemetRise" },
      { name: "description", content: "كل طلبات البيع وحالتها وأولويتها وقيمتها التقديرية." },
      { property: "og:title", content: "طلبات البيع | KemetRise" },
      { property: "og:description", content: "متابعة طلبات البيع في نظام KemetRise." },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_requests")
        .select(
          "id, code, title, status, priority, estimated_value, quantity, unit, created_at, required_delivery_date, customers(full_name, phone)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (priority !== "all" && r.priority !== priority) return false;
      if (!t) return true;
      const cust = (r.customers as { full_name: string } | null)?.full_name ?? "";
      return [r.code, r.title, cust].some((v) => String(v).toLowerCase().includes(t));
    });
  }, [data, term, status, priority]);

  return (
    <>
      <PageHeader
        title="طلبات البيع"
        subtitle={`${rows.length} طلب`}
        actions={
          <Button asChild size="sm">
            <Link to="/requests/new">
              <Plus className="size-4" />
              طلب جديد
            </Link>
          </Button>
        }
      />

      <div className="panel mb-4 grid gap-3 p-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="ابحث بالكود أو العنوان أو اسم العميل"
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
            {Object.entries(REQUEST_STATUS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue placeholder="الأولوية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأولويات</SelectItem>
            {Object.entries(PRIORITY).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}
      {data && rows.length === 0 ? (
        <EmptyState
          title="لا توجد طلبات مطابقة"
          description="ابدأ بإنشاء طلب بيع جديد أو عدّل الفلاتر."
          action={
            <Button asChild size="sm">
              <Link to="/requests/new">طلب جديد</Link>
            </Button>
          }
        />
      ) : null}

      {rows.length > 0 ? (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-right text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">الكود</th>
                <th className="px-4 py-3 font-medium">الطلب</th>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">الكمية</th>
                <th className="px-4 py-3 font-medium">القيمة التقديرية</th>
                <th className="px-4 py-3 font-medium">الأولوية</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium">العمر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40">
                  <td className="num px-4 py-3 text-xs text-muted-foreground">{r.code}</td>
                  <td className="px-4 py-3">
                    <Link
                      to="/requests/$id"
                      params={{ id: r.id }}
                      className="font-medium hover:text-primary"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {(r.customers as { full_name: string } | null)?.full_name ?? "—"}
                  </td>
                  <td className="num px-4 py-3">
                    {r.quantity} {r.unit}
                  </td>
                  <td className="num px-4 py-3">{egp(Number(r.estimated_value))}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      label={PRIORITY[r.priority]?.label ?? r.priority}
                      tone={PRIORITY[r.priority]?.tone}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      label={REQUEST_STATUS[r.status]?.label ?? r.status}
                      tone={REQUEST_STATUS[r.status]?.tone}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{age(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
