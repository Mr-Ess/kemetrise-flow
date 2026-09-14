import { useState } from "react";
import { toast } from "sonner";
import { Bell, CheckCircle2, MessageSquare, Wallet } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { EmptyState, SectionCard, StatusPill } from "@/components/ui-kit";
import {
  EXEC_STEP_STATUS,
  ORDER_STATUS,
  PAYMENT_INTENT_STATUS,
  PAYMENT_METHODS,
  QUOTATION_STATUS,
  REQUEST_STATUS,
} from "@/lib/constants";
import { egp, formatDate, formatDateTime, num } from "@/lib/format";
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

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PortalData = any;

export function CustomerPortalView({
  data,
  onChangeRequest,
  onAccept,
  onPay,
  busy,
  headerExtra,
}: {
  data: PortalData;
  onChangeRequest: (input: {
    quotationId: string;
    message: string;
    requestedPrice?: number | null;
    requestedDeliveryDays?: number | null;
  }) => Promise<unknown>;
  onAccept: (quotationId: string) => Promise<unknown>;
  onPay: (input: {
    orderId: string;
    gatewayKey: string;
    amount: number;
    reference?: string | null;
    payerName?: string | null;
    note?: string | null;
  }) => Promise<unknown>;
  busy?: boolean;
  headerExtra?: React.ReactNode;
}) {
  const [changeFor, setChangeFor] = useState<string | null>(null);
  const [change, setChange] = useState({ message: "", price: "", days: "" });
  const [payFor, setPayFor] = useState<{ id: string; remaining: number } | null>(null);
  const [pay, setPay] = useState({ gateway: "", amount: "", reference: "", payer: "", note: "" });

  const lastSeen = data.lastSeen ? new Date(data.lastSeen) : null;
  const isNew = (iso: string) => (lastSeen ? new Date(iso) > lastSeen : false);
  const updates = (data.timeline ?? []).filter((t: any) => isNew(t.created_at));

  const paidFor = (orderId: string) =>
    (data.payments ?? [])
      .filter((p: any) => p.order_id === orderId)
      .reduce((s: number, p: any) => s + Number(p.amount), 0);

  const gateway = (data.gateways ?? []).find((g: any) => g.key === pay.gateway);

  async function submitChange() {
    if (!changeFor || !change.message.trim()) {
      toast.error("اكتب التعديل المطلوب");
      return;
    }
    await onChangeRequest({
      quotationId: changeFor,
      message: change.message.trim(),
      requestedPrice: change.price ? Number(change.price) : null,
      requestedDeliveryDays: change.days ? Number(change.days) : null,
    });
    setChangeFor(null);
    setChange({ message: "", price: "", days: "" });
  }

  async function submitPay() {
    if (!payFor) return;
    const amount = Number(pay.amount);
    if (!pay.gateway) {
      toast.error("اختر طريقة الدفع");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("أدخل مبلغًا صحيحًا");
      return;
    }
    await onPay({
      orderId: payFor.id,
      gatewayKey: pay.gateway,
      amount,
      reference: pay.reference || null,
      payerName: pay.payer || null,
      note: pay.note || null,
    });
    setPayFor(null);
    setPay({ gateway: "", amount: "", reference: "", payer: "", note: "" });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <BrandMark />
        <div className="flex items-center gap-2">
          {updates.length > 0 ? (
            <StatusPill
              label={`${num(updates.length)} تحديث جديد`}
              tone="warning"
              className="gap-1"
            />
          ) : null}
          {headerExtra}
        </div>
      </header>

      <div className="panel mb-4 p-4">
        <p className="text-sm text-muted-foreground">مرحبًا</p>
        <h1 className="text-xl font-bold">
          {data.customer.company_name || data.customer.full_name}
        </h1>
        <p className="num text-xs text-muted-foreground">{data.customer.code}</p>
      </div>

      {updates.length > 0 ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
          <Bell className="mt-0.5 size-4 shrink-0" />
          <span>
            يوجد {num(updates.length)} تحديث جديد على طلباتك منذ آخر زيارة — آخرها:{" "}
            {updates[0]?.description ?? updates[0]?.action}
          </span>
        </div>
      ) : null}

      <Tabs defaultValue="quotes">
        <TabsList>
          <TabsTrigger value="quotes">عروض الأسعار</TabsTrigger>
          <TabsTrigger value="orders">الأوامر والتنفيذ</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="timeline">تاريخ الطلب</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4">
          {(data.requests ?? []).length === 0 ? (
            <EmptyState title="لا توجد طلبات حاليًا" />
          ) : null}
          {(data.requests ?? []).map((r: any) => {
            const quotes = (data.quotations ?? []).filter((q: any) => q.request_id === r.id);
            const changes = (data.changes ?? []).filter((c: any) =>
              quotes.some((q: any) => q.id === c.quotation_id),
            );
            return (
              <SectionCard key={r.id} title={r.title}>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="num">{r.code}</span>
                  <StatusPill
                    label={REQUEST_STATUS[r.status]?.label ?? r.status}
                    tone={REQUEST_STATUS[r.status]?.tone}
                  />
                  <span>
                    الكمية {num(r.quantity)} {r.unit}
                  </span>
                </div>
                {quotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    عرض السعر قيد التجهيز، سنوافيك فور جاهزيته.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {quotes.map((q: any) => (
                      <li key={q.id} className="py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="num text-base font-semibold">{egp(Number(q.total))}</p>
                          <StatusPill
                            label={QUOTATION_STATUS[q.status]?.label ?? q.status}
                            tone={QUOTATION_STATUS[q.status]?.tone}
                          />
                          <span className="text-xs text-muted-foreground">
                            إصدار {q.version} · مدة التسليم {num(q.delivery_days ?? 0)} يوم · صالح
                            حتى {formatDate(q.valid_until)}
                          </span>
                        </div>
                        {q.payment_terms ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            شروط الدفع: {q.payment_terms}
                          </p>
                        ) : null}
                        {q.is_current && !["accepted", "superseded", "expired"].includes(q.status) ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" disabled={busy} onClick={() => onAccept(q.id)}>
                              <CheckCircle2 className="size-4" />
                              موافقة على العرض
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setChangeFor(q.id)}
                            >
                              <MessageSquare className="size-4" />
                              طلب تعديل
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
                {changes.length > 0 ? (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground">طلبات التعديل</p>
                    {changes.map((c: any) => (
                      <div key={c.id} className="rounded-lg border border-border p-2 text-xs">
                        <p>{c.message}</p>
                        {c.response ? (
                          <p className="mt-1 text-muted-foreground">الرد: {c.response}</p>
                        ) : null}
                        <p className="mt-1 text-muted-foreground">{formatDateTime(c.created_at)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </SectionCard>
            );
          })}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {(data.orders ?? []).length === 0 ? <EmptyState title="لا توجد أوامر تنفيذ" /> : null}
          {(data.orders ?? []).map((o: any) => {
            const steps = (data.steps ?? []).filter((s: any) => s.order_id === o.id);
            const logs = (data.logs ?? []).filter((l: any) => l.order_id === o.id);
            const done = steps.filter((s: any) => s.status === "done").length;
            const progress = steps.length ? Math.round((done / steps.length) * 100) : 0;
            const paid = paidFor(o.id);
            const remaining = Number(o.total_price) - paid;
            return (
              <SectionCard key={o.id} title={o.title}>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="num">{o.code}</span>
                  <StatusPill
                    label={ORDER_STATUS[o.status]?.label ?? o.status}
                    tone={ORDER_STATUS[o.status]?.tone}
                  />
                  <span>تسليم متوقع {formatDate(o.expected_delivery)}</span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span>نسبة الإنجاز</span>
                    <span className="num">{progress}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <ul className="mb-3 space-y-1.5">
                  {steps.map((s: any) => (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={
                          s.status === "done"
                            ? "size-2 rounded-full bg-success"
                            : s.status === "in_progress"
                              ? "size-2 rounded-full bg-primary"
                              : "size-2 rounded-full bg-muted-foreground/40"
                        }
                      />
                      <span className="flex-1">{s.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {EXEC_STEP_STATUS[s.status]?.label ?? s.status}
                      </span>
                    </li>
                  ))}
                </ul>

                {logs.length > 0 ? (
                  <div className="mb-3 space-y-1 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground">آخر التحديثات</p>
                    {logs.slice(0, 5).map((l: any) => (
                      <p key={l.id} className="text-xs">
                        <span className="num text-muted-foreground">{formatDate(l.log_date)}</span> ·{" "}
                        {l.progress_note}
                      </p>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-sm">
                  <span>
                    الإجمالي <span className="num font-semibold">{egp(Number(o.total_price))}</span>
                  </span>
                  <span className="text-success">
                    المدفوع <span className="num">{egp(paid)}</span>
                  </span>
                  <span className={remaining > 0 ? "text-destructive" : "text-success"}>
                    المتبقي <span className="num">{egp(remaining)}</span>
                  </span>
                  {remaining > 0 ? (
                    <Button
                      size="sm"
                      className="ms-auto"
                      onClick={() => {
                        setPayFor({ id: o.id, remaining });
                        setPay({ ...pay, amount: String(remaining) });
                      }}
                    >
                      <Wallet className="size-4" />
                      ادفع الآن
                    </Button>
                  ) : null}
                </div>
              </SectionCard>
            );
          })}
        </TabsContent>

        <TabsContent value="payments">
          <SectionCard title="سجل المدفوعات">
            {(data.payments ?? []).length === 0 && (data.intents ?? []).length === 0 ? (
              <EmptyState title="لا توجد مدفوعات" />
            ) : (
              <ul className="divide-y divide-border">
                {(data.payments ?? []).map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-3">
                    <div>
                      <p className="num text-sm font-semibold">{egp(Number(p.amount))}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="num">{p.code}</span> ·{" "}
                        {PAYMENT_METHODS[p.method] ?? p.method}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill label="مُحصّلة" tone="success" />
                      <span className="num text-xs text-muted-foreground">
                        {formatDate(p.payment_date)}
                      </span>
                    </div>
                  </li>
                ))}
                {(data.intents ?? [])
                  .filter((i: any) => i.status !== "confirmed")
                  .map((i: any) => (
                    <li key={i.id} className="flex items-center justify-between gap-2 py-3">
                      <div>
                        <p className="num text-sm font-semibold">{egp(Number(i.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="num">{i.code}</span> ·{" "}
                          {PAYMENT_METHODS[i.method] ?? i.method}
                          {i.reference ? ` · مرجع ${i.reference}` : ""}
                        </p>
                      </div>
                      <StatusPill
                        label={PAYMENT_INTENT_STATUS[i.status]?.label ?? i.status}
                        tone={PAYMENT_INTENT_STATUS[i.status]?.tone}
                      />
                    </li>
                  ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="timeline">
          <SectionCard title="تاريخ طلبك بالكامل">
            {(data.timeline ?? []).length === 0 ? (
              <EmptyState title="لا يوجد سجل بعد" />
            ) : (
              <ol className="space-y-3">
                {(data.timeline ?? []).map((t: any) => (
                  <li key={t.id} className="flex items-start gap-3">
                    <span
                      className={
                        isNew(t.created_at)
                          ? "mt-1.5 size-2 shrink-0 rounded-full bg-warning"
                          : "mt-1.5 size-2 shrink-0 rounded-full bg-primary/60"
                      }
                    />
                    <div>
                      <p className="text-sm">{t.description ?? t.action}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="num">{t.entity_code ?? ""}</span>{" "}
                        {formatDateTime(t.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <Dialog open={!!changeFor} onOpenChange={(v) => !v && setChangeFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>طلب تعديل على عرض السعر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>التعديل المطلوب</Label>
              <Textarea
                rows={4}
                value={change.message}
                onChange={(e) => setChange({ ...change, message: e.target.value })}
                placeholder="مثال: أحتاج تخفيض السعر أو تسليم أسرع"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>السعر المقترح (اختياري)</Label>
                <Input
                  type="number"
                  dir="ltr"
                  value={change.price}
                  onChange={(e) => setChange({ ...change, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>مدة التسليم (يوم)</Label>
                <Input
                  type="number"
                  dir="ltr"
                  value={change.days}
                  onChange={(e) => setChange({ ...change, days: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitChange} disabled={busy}>
              إرسال الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payFor} onOpenChange={(v) => !v && setPayFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>دفع إلكتروني</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={pay.gateway} onValueChange={(v) => setPay({ ...pay, gateway: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  {(data.gateways ?? []).map((g: any) => (
                    <SelectItem key={g.key} value={g.key}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {gateway ? (
                <div className="rounded-lg border border-border bg-muted/40 p-2 text-xs">
                  <p>{gateway.instructions}</p>
                  {gateway.account_ref ? (
                    <p className="num mt-1 font-semibold">{gateway.account_ref}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>المبلغ (ج.م)</Label>
              <Input
                type="number"
                dir="ltr"
                value={pay.amount}
                onChange={(e) => setPay({ ...pay, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم عملية التحويل</Label>
              <Input
                dir="ltr"
                value={pay.reference}
                onChange={(e) => setPay({ ...pay, reference: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>اسم الدافع</Label>
              <Input
                value={pay.payer}
                onChange={(e) => setPay({ ...pay, payer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                rows={2}
                value={pay.note}
                onChange={(e) => setPay({ ...pay, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitPay} disabled={busy}>
              تأكيد الدفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
