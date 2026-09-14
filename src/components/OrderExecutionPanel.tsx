import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/actions";
import { EXEC_STEP_STATUS } from "@/lib/constants";
import { formatDate, num } from "@/lib/format";
import { EmptyState, InlineLoading, KpiCard, SectionCard, StatusPill } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Database } from "@/integrations/supabase/types";

type StepStatus = Database["public"]["Enums"]["exec_step_status"];

export function OrderExecutionPanel({
  orderId,
  orderCode,
  canEdit,
}: {
  orderId: string;
  orderCode?: string;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [stepOpen, setStepOpen] = useState(false);
  const [newStep, setNewStep] = useState({ name: "", planned_end: "" });
  const [logOpen, setLogOpen] = useState(false);
  const [log, setLog] = useState({
    step_id: "",
    log_date: new Date().toISOString().slice(0, 10),
    progress_note: "",
    hours: "",
    delay_days: "",
    delay_reason: "",
    is_customer_visible: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["execution", orderId],
    queryFn: async () => {
      const [steps, logs] = await Promise.all([
        supabase.from("order_execution_steps").select("*").eq("order_id", orderId).order("seq"),
        supabase
          .from("order_daily_logs")
          .select("*")
          .eq("order_id", orderId)
          .order("log_date", { ascending: false })
          .limit(60),
      ]);
      if (steps.error) throw steps.error;
      return { steps: steps.data ?? [], logs: logs.data ?? [] };
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["execution", orderId] });
    queryClient.invalidateQueries({ queryKey: ["control-tower"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const updateStep = useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Partial<Database["public"]["Tables"]["order_execution_steps"]["Update"]>;
      label?: string;
    }) => {
      const { error } = await supabase
        .from("order_execution_steps")
        .update(input.patch)
        .eq("id", input.id);
      if (error) throw error;
      if (input.label)
        await logActivity({
          entityType: "order",
          entityId: orderId,
          entityCode: orderCode ?? null,
          action: "execution_update",
          description: input.label,
        });
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  const addStep = useMutation({
    mutationFn: async () => {
      if (!newStep.name.trim()) throw new Error("أدخل اسم الخطوة");
      const seq = (data?.steps.length ?? 0) + 1;
      const { error } = await supabase.from("order_execution_steps").insert({
        order_id: orderId,
        seq,
        name: newStep.name.trim(),
        planned_end: newStep.planned_end || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت إضافة الخطوة");
      setStepOpen(false);
      setNewStep({ name: "", planned_end: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  const addLog = useMutation({
    mutationFn: async () => {
      if (!log.progress_note.trim()) throw new Error("اكتب ما تم إنجازه اليوم");
      const { data: auth } = await supabase.auth.getUser();
      const delay = Number(log.delay_days || 0);
      const { error } = await supabase.from("order_daily_logs").insert({
        order_id: orderId,
        step_id: log.step_id || null,
        log_date: log.log_date,
        progress_note: log.progress_note.trim(),
        hours: Number(log.hours || 0),
        delay_days: delay,
        delay_reason: log.delay_reason || null,
        is_customer_visible: log.is_customer_visible,
        created_by: auth.user?.id ?? null,
      });
      if (error) throw error;
      if (delay > 0 && log.step_id) {
        const step = data?.steps.find((s) => s.id === log.step_id);
        await supabase
          .from("order_execution_steps")
          .update({
            delay_days: Number(step?.delay_days ?? 0) + delay,
            delay_reason: log.delay_reason || step?.delay_reason || null,
          })
          .eq("id", log.step_id);
      }
      await logActivity({
        entityType: "order",
        entityId: orderId,
        entityCode: orderCode ?? null,
        action: "daily_log",
        description: `سجل يومي: ${log.progress_note.trim().slice(0, 120)}${delay > 0 ? ` (تأخير ${delay} يوم)` : ""}`,
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل اليومية");
      setLogOpen(false);
      setLog({ ...log, progress_note: "", hours: "", delay_days: "", delay_reason: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  if (isLoading) return <InlineLoading />;

  const steps = data?.steps ?? [];
  const logs = data?.logs ?? [];
  const done = steps.filter((s) => s.status === "done").length;
  const progress = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const totalDelay = steps.reduce((s, x) => s + Number(x.delay_days ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const late = steps.filter(
    (s) => s.planned_end && s.planned_end < today && !["done", "skipped"].includes(s.status),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="نسبة الإنجاز" value={`${progress}%`} tone={progress === 100 ? "success" : "info"} />
        <KpiCard label="خطوات منتهية" value={`${num(done)}/${num(steps.length)}`} tone="neutral" />
        <KpiCard label="خطوات متأخرة" value={num(late.length)} tone={late.length ? "danger" : "success"} />
        <KpiCard label="إجمالي أيام التأخير" value={num(totalDelay)} tone={totalDelay ? "warning" : "success"} />
      </div>

      <SectionCard
        title="خطة التنفيذ"
        actions={
          canEdit ? (
            <Button size="sm" variant="outline" onClick={() => setStepOpen(true)}>
              <Plus className="size-4" />
              خطوة
            </Button>
          ) : null
        }
      >
        {steps.length === 0 ? (
          <EmptyState title="لا توجد خطوات تنفيذ" />
        ) : (
          <ul className="divide-y divide-border">
            {steps.map((s) => {
              const isLate =
                s.planned_end && s.planned_end < today && !["done", "skipped"].includes(s.status);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-2 py-3">
                  <span className="num w-6 shrink-0 text-xs text-muted-foreground">{s.seq}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      مخطط: {formatDate(s.planned_start)} → {formatDate(s.planned_end)}
                      {s.actual_end ? ` · انتهت ${formatDate(s.actual_end)}` : ""}
                      {Number(s.delay_days) > 0 ? ` · تأخير ${s.delay_days} يوم` : ""}
                    </p>
                  </div>
                  {isLate ? <StatusPill label="متأخرة" tone="danger" /> : null}
                  {canEdit ? (
                    <Select
                      value={s.status}
                      onValueChange={(v) =>
                        updateStep.mutate({
                          id: s.id,
                          patch: {
                            status: v as StepStatus,
                            ...(v === "in_progress" && !s.actual_start
                              ? { actual_start: today }
                              : {}),
                            ...(v === "done" ? { actual_end: today } : {}),
                          },
                          label: `خطوة «${s.name}»: ${EXEC_STEP_STATUS[v]?.label ?? v}`,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EXEC_STEP_STATUS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusPill
                      label={EXEC_STEP_STATUS[s.status]?.label ?? s.status}
                      tone={EXEC_STEP_STATUS[s.status]?.tone}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="اليوميات والتأخيرات"
        actions={
          canEdit ? (
            <Button size="sm" onClick={() => setLogOpen(true)}>
              <Plus className="size-4" />
              تسجيل يومية
            </Button>
          ) : null
        }
      >
        {logs.length === 0 ? (
          <EmptyState title="لا توجد يوميات" description="سجّل ما تم إنجازه يوميًا وأي تأخير." />
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((l) => (
              <li key={l.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-xs text-muted-foreground">{formatDate(l.log_date)}</span>
                  {Number(l.delay_days) > 0 ? (
                    <StatusPill label={`تأخير ${l.delay_days} يوم`} tone="danger" />
                  ) : null}
                  {Number(l.hours) > 0 ? (
                    <StatusPill label={`${l.hours} ساعة`} tone="neutral" />
                  ) : null}
                  {l.is_customer_visible ? <StatusPill label="ظاهر للعميل" tone="info" /> : null}
                </div>
                <p className="mt-1 text-sm">{l.progress_note}</p>
                {l.delay_reason ? (
                  <p className="text-xs text-muted-foreground">السبب: {l.delay_reason}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Dialog open={stepOpen} onOpenChange={setStepOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة خطوة تنفيذ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الخطوة</Label>
              <Input
                value={newStep.name}
                onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الانتهاء المخطط</Label>
              <Input
                type="date"
                dir="ltr"
                value={newStep.planned_end}
                onChange={(e) => setNewStep({ ...newStep, planned_end: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addStep.mutate()} disabled={addStep.isPending}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل يومية تنفيذ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  dir="ltr"
                  value={log.log_date}
                  onChange={(e) => setLog({ ...log, log_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ساعات العمل</Label>
                <Input
                  type="number"
                  dir="ltr"
                  value={log.hours}
                  onChange={(e) => setLog({ ...log, hours: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الخطوة</Label>
              <Select value={log.step_id} onValueChange={(v) => setLog({ ...log, step_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الخطوة" />
                </SelectTrigger>
                <SelectContent>
                  {steps.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.seq}. {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ما تم إنجازه</Label>
              <Textarea
                rows={3}
                value={log.progress_note}
                onChange={(e) => setLog({ ...log, progress_note: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>أيام التأخير</Label>
                <Input
                  type="number"
                  dir="ltr"
                  value={log.delay_days}
                  onChange={(e) => setLog({ ...log, delay_days: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>سبب التأخير</Label>
                <Input
                  value={log.delay_reason}
                  onChange={(e) => setLog({ ...log, delay_reason: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={log.is_customer_visible}
                onCheckedChange={(v) => setLog({ ...log, is_customer_visible: v === true })}
              />
              إظهار هذا التحديث للعميل في بوابة المتابعة
            </label>
          </div>
          <DialogFooter>
            <Button onClick={() => addLog.mutate()} disabled={addLog.isPending}>
              حفظ اليومية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
