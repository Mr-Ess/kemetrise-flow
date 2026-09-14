import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logActivity, notify } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { LOST_REASONS, PRIORITY, QUOTATION_STATUS, REQUEST_STATUS } from "@/lib/constants";
import { egp, formatDate, formatDateTime, num } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/ui-kit";
import { CostingPanel } from "@/components/CostingPanel";
import { CommentsPanel } from "@/components/CommentsPanel";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { ChangeRequestsPanel } from "@/components/ChangeRequestsPanel";
import { PortalLinkButton } from "@/components/PortalLinkButton";
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
import type { Database } from "@/integrations/supabase/types";

type RequestStatus = Database["public"]["Enums"]["request_status"];

export const Route = createFileRoute("/_authenticated/requests/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل طلب البيع | KemetRise" },
      {
        name: "description",
        content: "دورة حياة طلب البيع: المراجعة والتسعير والاعتماد وعرض السعر والتحويل لأمر.",
      },
      { property: "og:title", content: "تفاصيل طلب البيع | KemetRise" },
      { property: "og:description", content: "إدارة طلب البيع خطوة بخطوة في KemetRise." },
    ],
  }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { canSeeCosts, isManager, hasRole } = useAuth();

  const [lostOpen, setLostOpen] = useState(false);
  const [lostReason, setLostReason] = useState("price");
  const [lostNotes, setLostNotes] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quote, setQuote] = useState({
    selling_price: "",
    discount: "0",
    tax: "0",
    delivery_days: "",
    valid_days: "14",
    payment_terms: "50% مقدم و50% عند التسليم",
    notes: "",
    change_reason: "",
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["request", id],
    queryFn: async () => {
      const [request, quotations, costing, order] = await Promise.all([
        supabase
          .from("sales_requests")
          .select("*, customers(id, code, full_name, phone, whatsapp), products_services(name)")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("quotations")
          .select("*")
          .eq("request_id", id)
          .order("version", { ascending: false }),
        supabase.from("costings").select("*").eq("request_id", id).maybeSingle(),
        supabase.from("orders").select("id, code").eq("request_id", id).maybeSingle(),
      ]);
      if (request.error) throw request.error;
      return {
        request: request.data,
        quotations: quotations.data ?? [],
        costing: costing.data,
        order: order.data,
      };
    },
  });

  const r = data?.request;
  const currentQuote = data?.quotations.find((q) => q.is_current) ?? data?.quotations[0];

  const changeStatus = useMutation({
    mutationFn: async (input: {
      status: RequestStatus;
      description: string;
      extra?: Record<string, unknown>;
      notifyRole?: Database["public"]["Enums"]["app_role"];
      notifyTitle?: string;
    }) => {
      const { error } = await supabase
        .from("sales_requests")
        .update({
          status: input.status,
          status_changed_at: new Date().toISOString(),
          ...(input.extra ?? {}),
        })
        .eq("id", id);
      if (error) throw error;
      await logActivity({
        entityType: "sales_request",
        entityId: id,
        entityCode: r?.code,
        action: input.status,
        description: input.description,
      });
      if (input.notifyRole) {
        await notify({
          title: input.notifyTitle ?? input.description,
          body: `${r?.code} — ${r?.title}`,
          link: `/requests/${id}`,
          targetRole: input.notifyRole,
        });
      }
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب");
      queryClient.invalidateQueries({ queryKey: ["request", id] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  const createQuotation = useMutation({
    mutationFn: async () => {
      if (!r) throw new Error("الطلب غير موجود");
      const sell = Number(quote.selling_price) || 0;
      if (sell <= 0) throw new Error("أدخل سعر بيع صحيح");
      const discount = Number(quote.discount) || 0;
      const tax = Number(quote.tax) || 0;
      const total = Math.max(0, sell - discount) * (1 + tax / 100);
      const version = (data?.quotations[0]?.version ?? 0) + 1;
      const { data: auth } = await supabase.auth.getUser();

      if (data?.quotations.length) {
        await supabase
          .from("quotations")
          .update({ is_current: false, status: "superseded" })
          .eq("request_id", id)
          .eq("is_current", true);
      }

      const validUntil = new Date(
        Date.now() + (Number(quote.valid_days) || 14) * 86400000,
      )
        .toISOString()
        .slice(0, 10);

      const { data: created, error } = await supabase
        .from("quotations")
        .insert({
          request_id: id,
          customer_id: r.customer_id,
          version,
          selling_price: sell,
          discount,
          tax,
          total: Math.round(total * 100) / 100,
          delivery_days: quote.delivery_days ? Number(quote.delivery_days) : null,
          valid_until: validUntil,
          payment_terms: quote.payment_terms || null,
          notes: quote.notes || null,
          change_reason: version > 1 ? quote.change_reason || null : null,
          previous_price: data?.quotations[0]?.total ?? null,
          status: "draft",
          is_current: true,
          created_by: auth.user?.id ?? null,
        })
        .select("id, code, version")
        .single();
      if (error) throw error;

      await supabase
        .from("sales_requests")
        .update({ status: "quotation_ready", status_changed_at: new Date().toISOString() })
        .eq("id", id);

      await logActivity({
        entityType: "quotation",
        entityId: id,
        entityCode: created.code,
        action: "quotation_created",
        description: `تم إنشاء عرض سعر (إصدار ${created.version}) بقيمة ${egp(total)}`,
      });
      return created;
    },
    onSuccess: () => {
      toast.success("تم إنشاء عرض السعر");
      setQuoteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["request", id] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (e: Error) => toast.error("تعذّر إنشاء العرض", { description: e.message }),
  });

  const quoteAction = useMutation({
    mutationFn: async (input: {
      quotationStatus: Database["public"]["Enums"]["quotation_status"];
      requestStatus: RequestStatus;
      description: string;
    }) => {
      if (!currentQuote) throw new Error("لا يوجد عرض سعر حالي");
      const { error } = await supabase
        .from("quotations")
        .update({ status: input.quotationStatus })
        .eq("id", currentQuote.id);
      if (error) throw error;
      await supabase
        .from("sales_requests")
        .update({ status: input.requestStatus, status_changed_at: new Date().toISOString() })
        .eq("id", id);
      await logActivity({
        entityType: "quotation",
        entityId: id,
        entityCode: currentQuote.code,
        action: input.quotationStatus,
        description: input.description,
      });
    },
    onSuccess: () => {
      toast.success("تم التحديث");
      queryClient.invalidateQueries({ queryKey: ["request", id] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  const convertToOrder = useMutation({
    mutationFn: async () => {
      if (!r || !currentQuote) throw new Error("يلزم عرض سعر مقبول");
      const { data: auth } = await supabase.auth.getUser();
      const expected = currentQuote.delivery_days
        ? new Date(Date.now() + currentQuote.delivery_days * 86400000).toISOString().slice(0, 10)
        : r.required_delivery_date;
      const { data: created, error } = await supabase
        .from("orders")
        .insert({
          customer_id: r.customer_id,
          request_id: r.id,
          quotation_id: currentQuote.id,
          title: r.title,
          description: r.description,
          quantity: r.quantity,
          specs: r.specs,
          total_price: currentQuote.total,
          expected_delivery: expected,
          status: "new",
          created_by: auth.user?.id ?? null,
          assigned_to: r.salesperson_id,
        })
        .select("id, code")
        .single();
      if (error) throw error;

      await supabase
        .from("sales_requests")
        .update({ status: "converted_to_order", status_changed_at: new Date().toISOString() })
        .eq("id", id);
      await supabase.from("customers").update({ status: "active" }).eq("id", r.customer_id);

      await logActivity({
        entityType: "order",
        entityId: created.id,
        entityCode: created.code,
        action: "order_created",
        description: `تم تحويل الطلب ${r.code} إلى أمر تنفيذ ${created.code}`,
      });
      await notify({
        title: "أمر تنفيذ جديد",
        body: `${created.code} — ${r.title}`,
        link: `/orders/${created.id}`,
        targetRole: "management",
      });
      return created;
    },
    onSuccess: (created) => {
      toast.success("تم تحويل الطلب إلى أمر تنفيذ");
      queryClient.invalidateQueries();
      navigate({ to: "/orders/$id", params: { id: created.id } });
    },
    onError: (e: Error) => toast.error("تعذّر التحويل", { description: e.message }),
  });

  if (isLoading) return <LoadingState rows={6} />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!r) return <EmptyState title="الطلب غير موجود" />;

  const cust = r.customers as { id: string; full_name: string; phone: string } | null;
  const status = r.status as RequestStatus;
  const canSell = hasRole("admin", "management", "sales");
  const canCost = hasRole("admin", "management", "costing");

  const actions: { label: string; onClick: () => void; variant?: "default" | "outline" }[] = [];
  if (canSell && status === "draft")
    actions.push({
      label: "إرسال للمراجعة",
      onClick: () =>
        changeStatus.mutate({
          status: "submitted",
          description: "تم إرسال الطلب للمراجعة",
          extra: { submitted_at: new Date().toISOString() },
          notifyRole: "management",
          notifyTitle: "طلب بيع جديد بانتظار المراجعة",
        }),
    });
  if (isManager && status === "submitted")
    actions.push({
      label: "بدء المراجعة",
      onClick: () =>
        changeStatus.mutate({ status: "under_review", description: "بدأت مراجعة الطلب" }),
    });
  if (isManager && ["submitted", "under_review"].includes(status))
    actions.push({
      label: "طلب معلومات إضافية",
      variant: "outline",
      onClick: () =>
        changeStatus.mutate({
          status: "waiting_information",
          description: "تم طلب معلومات إضافية من العميل",
          notifyRole: "sales",
          notifyTitle: "مطلوب معلومات إضافية من العميل",
        }),
    });
  if (canSell && status === "waiting_information")
    actions.push({
      label: "تم استلام المعلومات",
      onClick: () =>
        changeStatus.mutate({ status: "under_review", description: "تم استكمال المعلومات الناقصة" }),
    });
  if (isManager && ["under_review", "waiting_information"].includes(status))
    actions.push({
      label: "إرسال للتسعير",
      onClick: () =>
        changeStatus.mutate({
          status: "costing_in_progress",
          description: "تم إرسال الطلب لقسم التسعير",
          notifyRole: "costing",
          notifyTitle: "طلب جديد بانتظار التسعير",
        }),
    });
  if (isManager && status === "pending_approval") {
    actions.push({
      label: "اعتماد التسعير",
      onClick: async () => {
        if (data?.costing) {
          const { data: auth } = await supabase.auth.getUser();
          await supabase
            .from("costings")
            .update({
              approved_at: new Date().toISOString(),
              approved_by: auth.user?.id ?? null,
              approved_price: data.costing.suggested_price,
            })
            .eq("id", data.costing.id);
        }
        changeStatus.mutate({
          status: "costing_completed",
          description: "تم اعتماد التسعير من الإدارة",
          notifyRole: "sales",
          notifyTitle: "تم اعتماد التسعير — جهّز عرض السعر",
        });
      },
    });
    actions.push({
      label: "رفض وإعادة التسعير",
      variant: "outline",
      onClick: () =>
        changeStatus.mutate({
          status: "costing_in_progress",
          description: "تم رفض التسعير وإعادته للمراجعة",
          notifyRole: "costing",
          notifyTitle: "التسعير مرفوض — مطلوب مراجعة",
        }),
    });
  }
  if (canSell && ["costing_completed", "negotiation"].includes(status))
    actions.push({
      label: data?.quotations.length ? "إصدار عرض سعر جديد" : "إنشاء عرض سعر",
      onClick: () => {
        setQuote({
          ...quote,
          selling_price: String(
            data?.costing?.approved_price ?? data?.costing?.suggested_price ?? r.estimated_value,
          ),
          delivery_days: data?.costing?.delivery_days ? String(data.costing.delivery_days) : "",
        });
        setQuoteOpen(true);
      },
    });
  if (canSell && status === "quotation_ready" && currentQuote)
    actions.push({
      label: "تسجيل إرسال العرض للعميل",
      onClick: () =>
        quoteAction.mutate({
          quotationStatus: "sent",
          requestStatus: "quotation_sent",
          description: "تم إرسال عرض السعر للعميل",
        }),
    });
  if (canSell && ["quotation_sent", "negotiation"].includes(status) && currentQuote) {
    actions.push({
      label: "العميل وافق",
      onClick: () =>
        quoteAction.mutate({
          quotationStatus: "accepted",
          requestStatus: "customer_approved",
          description: "وافق العميل على عرض السعر",
        }),
    });
    actions.push({
      label: "دخول تفاوض",
      variant: "outline",
      onClick: () =>
        quoteAction.mutate({
          quotationStatus: "negotiation",
          requestStatus: "negotiation",
          description: "العميل طلب تعديل العرض",
        }),
    });
  }
  if (canSell && status === "customer_approved")
    actions.push({
      label: "تحويل إلى أمر تنفيذ",
      onClick: () => convertToOrder.mutate(),
    });
  if (canSell && !["converted_to_order", "cancelled", "customer_rejected"].includes(status))
    actions.push({
      label: "تسجيل كطلب مفقود",
      variant: "outline",
      onClick: () => setLostOpen(true),
    });

  return (
    <>
      <PageHeader
        title={r.title}
        subtitle={`${r.code} · ${cust?.full_name ?? ""}`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link to="/requests">
                <ArrowRight className="size-4" />
                كل الطلبات
              </Link>
            </Button>
            {data?.order ? (
              <Button asChild size="sm">
                <Link to="/orders/$id" params={{ id: data.order.id }}>
                  أمر التنفيذ {data.order.code}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="panel mb-4 flex flex-wrap items-center gap-3 p-4">
        <StatusPill
          label={REQUEST_STATUS[status]?.label ?? status}
          tone={REQUEST_STATUS[status]?.tone}
        />
        <StatusPill
          label={`أولوية: ${PRIORITY[r.priority]?.label ?? r.priority}`}
          tone={PRIORITY[r.priority]?.tone}
        />
        <span className="text-xs text-muted-foreground">
          آخر تحديث للحالة: {formatDateTime(r.status_changed_at)}
        </span>
        <div className="ms-auto flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant={a.variant ?? "default"}
              onClick={a.onClick}
              disabled={changeStatus.isPending || quoteAction.isPending || convertToOrder.isPending}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="تفاصيل الطلب" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field
              label="العميل"
              value={
                cust ? (
                  <Link to="/customers/$id" params={{ id: cust.id }} className="hover:text-primary">
                    {cust.full_name}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <Field label="هاتف العميل" value={<span className="num">{cust?.phone ?? "—"}</span>} />
            <Field
              label="المنتج / الخدمة"
              value={(r.products_services as { name: string } | null)?.name ?? "—"}
            />
            <Field
              label="الكمية"
              value={
                <span className="num">
                  {num(r.quantity)} {r.unit}
                </span>
              }
            />
            <Field label="الخامة" value={r.material || "—"} />
            <Field label="اللون" value={r.color || "—"} />
            <Field label="المقاسات" value={r.dimensions || "—"} />
            <Field label="التشطيب" value={r.finish || "—"} />
            <Field label="تاريخ التسليم المطلوب" value={formatDate(r.required_delivery_date)} />
            <Field
              label="القيمة التقديرية"
              value={<span className="num">{egp(Number(r.estimated_value))}</span>}
            />
            <Field label="تاريخ الإنشاء" value={formatDate(r.created_at)} />
            <Field label="تاريخ الإرسال" value={formatDate(r.submitted_at)} />
            <div className="col-span-2 sm:col-span-4">
              <Field label="الوصف" value={r.description || "—"} />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <Field label="ملاحظات العميل" value={r.customer_notes || "—"} />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <Field label="ملاحظات داخلية" value={r.internal_notes || "—"} />
            </div>
            {r.lost_reason ? (
              <div className="col-span-2 sm:col-span-4">
                <Field
                  label="سبب الفقد"
                  value={`${LOST_REASONS[r.lost_reason] ?? r.lost_reason}${r.lost_notes ? ` — ${r.lost_notes}` : ""}`}
                />
              </div>
            ) : null}
          </div>
        </SectionCard>

        <AttachmentsPanel requestId={id} />
      </div>

      <div className="mt-4">
        <Tabs defaultValue={canSeeCosts ? "costing" : "quotations"}>
          <TabsList>
            {canSeeCosts ? <TabsTrigger value="costing">التسعير الداخلي</TabsTrigger> : null}
            <TabsTrigger value="quotations">عروض الأسعار</TabsTrigger>
            <TabsTrigger value="changes">طلبات التعديل</TabsTrigger>
            <TabsTrigger value="comments">التعليقات</TabsTrigger>
            <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
          </TabsList>

          <TabsContent value="changes">
            <ChangeRequestsPanel requestId={id} />
          </TabsContent>

          {canSeeCosts ? (
            <TabsContent value="costing" className="mt-4">
              <CostingPanel
                requestId={id}
                requestCode={r.code}
                canEdit={canCost && !["converted_to_order", "cancelled"].includes(status)}
              />
            </TabsContent>
          ) : null}

          <TabsContent value="quotations" className="mt-4">
            <SectionCard title="سجل عروض الأسعار">
              {data!.quotations.length === 0 ? (
                <EmptyState
                  title="لا توجد عروض أسعار"
                  description="يتم إنشاء عرض السعر بعد اكتماله واعتماده."
                />
              ) : (
                <ul className="space-y-3">
                  {data!.quotations.map((q) => (
                    <li
                      key={q.id}
                      className="rounded-lg border border-border bg-surface p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            <span className="num">{q.code}</span> — إصدار{" "}
                            <span className="num">{q.version}</span>
                            {q.is_current ? " (الحالي)" : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            صالح حتى {formatDate(q.valid_until)} · {q.payment_terms ?? "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="num text-sm font-bold">{egp(Number(q.total))}</span>
                          <StatusPill
                            label={QUOTATION_STATUS[q.status]?.label ?? q.status}
                            tone={QUOTATION_STATUS[q.status]?.tone}
                          />
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Field
                          label="سعر البيع"
                          value={<span className="num">{egp(Number(q.selling_price))}</span>}
                        />
                        <Field
                          label="الخصم"
                          value={<span className="num">{egp(Number(q.discount))}</span>}
                        />
                        <Field
                          label="الضريبة"
                          value={<span className="num">{num(Number(q.tax), 1)}%</span>}
                        />
                        <Field
                          label="مدة التنفيذ"
                          value={q.delivery_days ? `${q.delivery_days} يوم` : "—"}
                        />
                      </div>
                      {q.change_reason ? (
                        <p className="mt-3 text-xs text-warning">سبب التعديل: {q.change_reason}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsPanel entityType="sales_request" entityId={id} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ActivityFeed entityId={id} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              إنشاء عرض سعر (إصدار {(data?.quotations[0]?.version ?? 0) + 1})
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>سعر البيع (ج.م)</Label>
              <Input
                type="number"
                dir="ltr"
                value={quote.selling_price}
                onChange={(e) => setQuote({ ...quote, selling_price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الخصم (ج.م)</Label>
              <Input
                type="number"
                dir="ltr"
                value={quote.discount}
                onChange={(e) => setQuote({ ...quote, discount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الضريبة %</Label>
              <Input
                type="number"
                dir="ltr"
                value={quote.tax}
                onChange={(e) => setQuote({ ...quote, tax: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>مدة التنفيذ (يوم)</Label>
              <Input
                type="number"
                dir="ltr"
                value={quote.delivery_days}
                onChange={(e) => setQuote({ ...quote, delivery_days: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>صلاحية العرض (يوم)</Label>
              <Input
                type="number"
                dir="ltr"
                value={quote.valid_days}
                onChange={(e) => setQuote({ ...quote, valid_days: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>شروط الدفع</Label>
              <Input
                value={quote.payment_terms}
                onChange={(e) => setQuote({ ...quote, payment_terms: e.target.value })}
              />
            </div>
            {(data?.quotations[0]?.version ?? 0) > 0 ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>سبب إصدار نسخة جديدة</Label>
                <Input
                  value={quote.change_reason}
                  onChange={(e) => setQuote({ ...quote, change_reason: e.target.value })}
                  placeholder="مثال: تخفيض بعد تفاوض العميل"
                />
              </div>
            ) : null}
            <div className="space-y-2 sm:col-span-2">
              <Label>ملاحظات العرض</Label>
              <Textarea
                rows={3}
                value={quote.notes}
                onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createQuotation.mutate()} disabled={createQuotation.isPending}>
              إنشاء العرض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل الطلب كمفقود</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>سبب الفقد</Label>
              <Select value={lostReason} onValueChange={setLostReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOST_REASONS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تفاصيل إضافية</Label>
              <Textarea rows={3} value={lostNotes} onChange={(e) => setLostNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                changeStatus.mutate({
                  status: "customer_rejected",
                  description: `تم تسجيل الطلب كمفقود — ${LOST_REASONS[lostReason]}`,
                  extra: { lost_reason: lostReason, lost_notes: lostNotes || null },
                });
                setLostOpen(false);
              }}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
