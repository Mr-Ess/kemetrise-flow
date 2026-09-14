import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Phone, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/actions";
import { CUSTOMER_STATUS, GOVERNORATES, LEAD_SOURCES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusPill } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type CustomerStatus = Database["public"]["Enums"]["customer_status"];
type LeadSource = Database["public"]["Enums"]["lead_source"];

export const Route = createFileRoute("/_authenticated/customers/")({
  head: () => ({
    meta: [
      { title: "العملاء | KemetRise" },
      { name: "description", content: "قاعدة عملاء KemetRise: بحث وتصنيف وحالة كل عميل." },
      { property: "og:title", content: "العملاء | KemetRise" },
      { property: "og:description", content: "إدارة بيانات العملاء ومصادرهم وحالتهم." },
    ],
  }),
  component: CustomersPage,
});

const emptyForm = {
  full_name: "",
  phone: "",
  whatsapp: "",
  email: "",
  company_name: "",
  governorate: "",
  city: "",
  address: "",
  source: "facebook" as LeadSource,
  status: "prospect" as CustomerStatus,
  notes: "",
};

function CustomersPage() {
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [gov, setGov] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim() || !form.phone.trim()) {
        throw new Error("الاسم ورقم الهاتف مطلوبان");
      }
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("customers")
        .insert({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim() || null,
          email: form.email.trim() || null,
          company_name: form.company_name.trim() || null,
          governorate: form.governorate || null,
          city: form.city.trim() || null,
          address: form.address.trim() || null,
          source: form.source,
          status: form.status,
          notes: form.notes.trim() || null,
          created_by: auth.user?.id ?? null,
          assigned_to: auth.user?.id ?? null,
        })
        .select("id, code, full_name")
        .single();
      if (error) throw error;
      await logActivity({
        entityType: "customer",
        entityId: data.id,
        entityCode: data.code,
        action: "created",
        description: `تم إنشاء العميل ${data.full_name}`,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("تم إضافة العميل");
      setForm(emptyForm);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (source !== "all" && c.source !== source) return false;
      if (gov !== "all" && c.governorate !== gov) return false;
      if (!t) return true;
      return [c.full_name, c.phone, c.whatsapp, c.company_name, c.code, c.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t));
    });
  }, [data, term, status, source, gov]);

  return (
    <>
      <PageHeader
        title="العملاء"
        subtitle={`${rows.length} عميل`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                عميل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>إضافة عميل جديد</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>الاسم بالكامل *</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف *</Label>
                  <Input
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>واتساب</Label>
                  <Input
                    dir="ltr"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    dir="ltr"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الشركة</Label>
                  <Input
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>المحافظة</Label>
                  <Select
                    value={form.governorate}
                    onValueChange={(v) => setForm({ ...form, governorate: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المحافظة" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOVERNORATES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المدينة / المنطقة</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>مصدر العميل</Label>
                  <Select
                    value={form.source}
                    onValueChange={(v) => setForm({ ...form, source: v as LeadSource })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAD_SOURCES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as CustomerStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CUSTOMER_STATUS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>العنوان</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={create.isPending}
                >
                  حفظ العميل
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="panel mb-4 grid gap-3 p-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="ابحث بالاسم أو الهاتف أو الكود"
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
            {Object.entries(CUSTOMER_STATUS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger>
            <SelectValue placeholder="المصدر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المصادر</SelectItem>
            {Object.entries(LEAD_SOURCES).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={gov} onValueChange={setGov}>
          <SelectTrigger>
            <SelectValue placeholder="المحافظة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المحافظات</SelectItem>
            {GOVERNORATES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}

      {data && rows.length === 0 ? (
        <EmptyState title="لا يوجد عملاء مطابقون" description="جرّب تعديل البحث أو الفلاتر." />
      ) : null}

      {rows.length > 0 ? (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-right text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">الكود</th>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">الهاتف</th>
                <th className="px-4 py-3 font-medium">المحافظة</th>
                <th className="px-4 py-3 font-medium">المصدر</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium">تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="num px-4 py-3 text-xs text-muted-foreground">{c.code}</td>
                  <td className="px-4 py-3">
                    <Link
                      to="/customers/$id"
                      params={{ id: c.id }}
                      className="font-medium hover:text-primary"
                    >
                      {c.full_name}
                    </Link>
                    {c.company_name ? (
                      <p className="text-xs text-muted-foreground">{c.company_name}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`tel:${c.phone}`}
                      className="num inline-flex items-center gap-1 hover:text-primary"
                      dir="ltr"
                    >
                      <Phone className="size-3.5" />
                      {c.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3">{c.governorate ?? "—"}</td>
                  <td className="px-4 py-3">{LEAD_SOURCES[c.source] ?? c.source}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      label={CUSTOMER_STATUS[c.status]?.label ?? c.status}
                      tone={CUSTOMER_STATUS[c.status]?.tone}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
