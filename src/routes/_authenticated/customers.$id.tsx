import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, MessageCircle, Phone, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/actions";
import {
  CUSTOMER_STATUS,
  GOVERNORATES,
  LEAD_SOURCES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  REQUEST_STATUS,
} from "@/lib/constants";
import { egp, formatDate, formatDateTime, num } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  Field,
  KpiCard,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/ui-kit";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  head: () => ({
    meta: [
      { title: "ملف العميل | KemetRise" },
      { name: "description", content: "ملف العميل الكامل: الطلبات والأوامر والمدفوعات والمتابعات." },
      { property: "og:title", content: "ملف العميل | KemetRise" },
      { property: "og:description", content: "سجل تعاملات العميل داخل نظام KemetRise." },
    ],
  }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const [customer, requests, orders, payments, tasks, activities] = await Promise.all([
        supabase.from("customers").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("sales_requests")
          .select("id, code, title, status, estimated_value, created_at")
          .eq("customer_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, code, title, status, total_price, expected_delivery")
          .eq("customer_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("id, code, amount, method, payment_date, reference")
          .eq("customer_id", id)
          .eq("is_void", false)
          .order("payment_date", { ascending: false }),
        supabase
          .from("tasks")
          .select("id, title, status, due_date, task_type")
          .eq("customer_id", id)
          .order("due_date", { ascending: true }),
        supabase
          .from("activities")
          .select("id, action, description, created_at, entity_type, entity_code")
          .eq("entity_id", id)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      if (customer.error) throw customer.error;
      return {
        customer: customer.data,
        requests: requests.data ?? [],
        orders: orders.data ?? [],
        payments: payments.data ?? [],
        tasks: tasks.data ?? [],
        activities: activities.data ?? [],
      };
    },
  });

  const c = data?.customer;
  const [form, setForm] = useState<Record<string, string>>({});

  function openEdit() {
    if (!c) return;
    setForm({
      full_name: c.full_name ?? "",
      phone: c.phone ?? "",
      whatsapp: c.whatsapp ?? "",
      email: c.email ?? "",
      company_name: c.company_name ?? "",
      governorate: c.governorate ?? "",
      city: c.city ?? "",
      address: c.address ?? "",
      source: c.source,
      status: c.status,
      notes: c.notes ?? "",
    });
    setEditing(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("customers")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          whatsapp: form.whatsapp || null,
          email: form.email || null,
          company_name: form.company_name || null,
          governorate: form.governorate || null,
          city: form.city || null,
          address: form.address || null,
          source: form.source as never,
          status: form.status as never,
          notes: form.notes || null,
        })
        .eq("id", id);
      if (error) throw error;
      await logActivity({
        entityType: "customer",
        entityId: id,
        entityCode: c?.code,
        action: "updated",
        description: "تم تعديل بيانات العميل",
      });
    },
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  if (isLoading) return <LoadingState rows={6} />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!c) return <EmptyState title="العميل غير موجود" />;

  const totalOrders = data!.orders.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
  const totalPaid = data!.payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);

  return (
    <>
      <PageHeader
        title={c.full_name}
        subtitle={`${c.code} · ${LEAD_SOURCES[c.source] ?? c.source}`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link to="/customers">
                <ArrowRight className="size-4" />
                كل العملاء
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={`tel:${c.phone}`}>
                <Phone className="size-4" />
                اتصال
              </a>
            </Button>
            {c.whatsapp ? (
              <Button asChild size="sm" variant="outline">
                <a
                  href={`https://wa.me/2${c.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" />
                  واتساب
                </a>
              </Button>
            ) : null}
            <Button size="sm" onClick={openEdit}>
              تعديل البيانات
            </Button>
            <Button asChild size="sm">
              <Link to="/requests/new" search={{ customer: id }}>
                <Plus className="size-4" />
                طلب بيع
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="عدد الطلبات" value={num(data!.requests.length)} />
        <KpiCard label="عدد الأوامر" value={num(data!.orders.length)} />
        <KpiCard label="إجمالي التعاملات" value={egp(totalOrders)} tone="success" />
        <KpiCard label="المتبقي" value={egp(totalOrders - totalPaid)} tone="danger" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="بيانات العميل" className="lg:col-span-1">
          <div className="grid grid-cols-2 gap-4">
            <Field label="الهاتف" value={<span className="num">{c.phone}</span>} />
            <Field label="واتساب" value={<span className="num">{c.whatsapp || "—"}</span>} />
            <Field label="البريد" value={c.email || "—"} />
            <Field label="الشركة" value={c.company_name || "—"} />
            <Field label="المحافظة" value={c.governorate || "—"} />
            <Field label="المدينة" value={c.city || "—"} />
            <Field
              label="الحالة"
              value={
                <StatusPill
                  label={CUSTOMER_STATUS[c.status]?.label ?? c.status}
                  tone={CUSTOMER_STATUS[c.status]?.tone}
                />
              }
            />
            <Field label="تاريخ الإضافة" value={formatDate(c.created_at)} />
            <div className="col-span-2">
              <Field label="العنوان" value={c.address || "—"} />
            </div>
            <div className="col-span-2">
              <Field label="ملاحظات" value={c.notes || "—"} />
            </div>
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <Tabs defaultValue="requests">
            <TabsList className="flex-wrap">
              <TabsTrigger value="requests">الطلبات</TabsTrigger>
              <TabsTrigger value="orders">الأوامر</TabsTrigger>
              <TabsTrigger value="payments">المدفوعات</TabsTrigger>
              <TabsTrigger value="tasks">المتابعات</TabsTrigger>
              <TabsTrigger value="activity">السجل</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-4">
              <SectionCard>
                {data!.requests.length === 0 ? (
                  <EmptyState title="لا توجد طلبات لهذا العميل" />
                ) : (
                  <ul className="divide-y divide-border">
                    {data!.requests.map((r) => (
                      <li key={r.id}>
                        <Link
                          to="/requests/$id"
                          params={{ id: r.id }}
                          className="flex items-center justify-between gap-3 py-3 hover:text-primary"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{r.title}</p>
                            <p className="num text-xs text-muted-foreground">{r.code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="num text-sm">{egp(Number(r.estimated_value))}</span>
                            <StatusPill
                              label={REQUEST_STATUS[r.status]?.label ?? r.status}
                              tone={REQUEST_STATUS[r.status]?.tone}
                            />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              <SectionCard>
                {data!.orders.length === 0 ? (
                  <EmptyState title="لا توجد أوامر لهذا العميل" />
                ) : (
                  <ul className="divide-y divide-border">
                    {data!.orders.map((o) => (
                      <li key={o.id}>
                        <Link
                          to="/orders/$id"
                          params={{ id: o.id }}
                          className="flex items-center justify-between gap-3 py-3 hover:text-primary"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{o.title}</p>
                            <p className="text-xs text-muted-foreground">
                              <span className="num">{o.code}</span> · تسليم{" "}
                              {formatDate(o.expected_delivery)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="num text-sm">{egp(Number(o.total_price))}</span>
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
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <SectionCard>
                {data!.payments.length === 0 ? (
                  <EmptyState title="لا توجد مدفوعات مسجلة" />
                ) : (
                  <ul className="divide-y divide-border">
                    {data!.payments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <p className="num text-sm font-medium">{egp(Number(p.amount))}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="num">{p.code}</span> ·{" "}
                            {PAYMENT_METHODS[p.method] ?? p.method}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(p.payment_date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <SectionCard>
                {data!.tasks.length === 0 ? (
                  <EmptyState title="لا توجد متابعات" />
                ) : (
                  <ul className="divide-y divide-border">
                    {data!.tasks.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                        <p className="text-sm">{t.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(t.due_date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <SectionCard>
                {data!.activities.length === 0 ? (
                  <EmptyState title="لا يوجد سجل نشاط" />
                ) : (
                  <ol className="space-y-3">
                    {data!.activities.map((a) => (
                      <li key={a.id} className="flex gap-3">
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm">{a.description ?? a.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(a.created_at)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل بيانات العميل</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>الاسم بالكامل</Label>
              <Input
                value={form.full_name ?? ""}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الهاتف</Label>
              <Input
                dir="ltr"
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>واتساب</Label>
              <Input
                dir="ltr"
                value={form.whatsapp ?? ""}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>البريد</Label>
              <Input
                dir="ltr"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الشركة</Label>
              <Input
                value={form.company_name ?? ""}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>المحافظة</Label>
              <Select
                value={form.governorate ?? ""}
                onValueChange={(v) => setForm({ ...form, governorate: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر" />
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
              <Label>المدينة</Label>
              <Input
                value={form.city ?? ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>المصدر</Label>
              <Select
                value={form.source ?? ""}
                onValueChange={(v) => setForm({ ...form, source: v })}
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
                value={form.status ?? ""}
                onValueChange={(v) => setForm({ ...form, status: v })}
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
                value={form.address ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea
                rows={3}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
