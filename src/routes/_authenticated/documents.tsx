import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { DOCUMENT_STATUS } from "@/lib/constants";
import { formatDate, num } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  PageHeader,
} from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type DocStatus = Database["public"]["Enums"]["document_status"];

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "المستندات | KemetRise" },
      { name: "description", content: "متابعة المستندات المطلوبة من العملاء وحالة استلامها." },
      { property: "og:title", content: "المستندات | KemetRise" },
      { property: "og:description", content: "إدارة مستندات العملاء والأوامر في KemetRise." },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, customers(full_name), orders(id, code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; status: DocStatus }) => {
      const { error } = await supabase
        .from("documents")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة المستند");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (data ?? []).filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (!t) return true;
      const cust = (d.customers as { full_name: string } | null)?.full_name ?? "";
      return [d.code, d.name, cust].some((v) => String(v ?? "").toLowerCase().includes(t));
    });
  }, [data, term, status]);

  const missing = (data ?? []).filter((d) => ["required", "requested", "missing"].includes(d.status));

  return (
    <>
      <PageHeader title="المستندات" subtitle="المستندات المطلوبة من العملاء وحالتها" />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="إجمالي المستندات" value={num(data?.length ?? 0)} />
        <KpiCard label="ناقصة / مطلوبة" value={num(missing.length)} tone="warning" />
        <KpiCard
          label="تم استلامها"
          value={num((data ?? []).filter((d) => d.status === "received").length)}
          tone="info"
        />
        <KpiCard
          label="تم التحقق"
          value={num((data ?? []).filter((d) => d.status === "verified").length)}
          tone="success"
        />
      </div>

      <div className="panel mb-4 grid gap-3 p-4 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="ابحث باسم المستند أو العميل"
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
            {Object.entries(DOCUMENT_STATUS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}
      {data && rows.length === 0 ? <EmptyState title="لا توجد مستندات مطابقة" /> : null}

      {rows.length > 0 ? (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-right text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">الكود</th>
                <th className="px-4 py-3 font-medium">المستند</th>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">الأمر</th>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((d) => {
                const order = d.orders as { id: string; code: string } | null;
                return (
                  <tr key={d.id} className="hover:bg-muted/40">
                    <td className="num px-4 py-3 text-xs text-muted-foreground">{d.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{d.name}</p>
                      {d.doc_type ? (
                        <p className="text-xs text-muted-foreground">{d.doc_type}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {(d.customers as { full_name: string } | null)?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {order ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/orders/$id" params={{ id: order.id }}>
                            <span className="num">{order.code}</span>
                          </Link>
                        </Button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">{formatDate(d.created_at)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={d.status}
                        onValueChange={(v) => update.mutate({ id: d.id, status: v as DocStatus })}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DOCUMENT_STATUS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
