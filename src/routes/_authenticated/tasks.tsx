import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/actions";
import { PRIORITY, TASK_STATUS, TASK_TYPES } from "@/lib/constants";
import { formatDate, isOverdue, num } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
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

type Priority = Database["public"]["Enums"]["priority_level"];

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "المتابعات | KemetRise" },
      { name: "description", content: "مهام المتابعة مع العملاء ومواعيدها وحالتها." },
      { property: "og:title", content: "المتابعات | KemetRise" },
      { property: "og:description", content: "إدارة متابعات فريق المبيعات في KemetRise." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("open");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    task_type: "follow_up",
    customer_id: "",
    due_date: new Date().toISOString().slice(0, 10),
    priority: "normal" as Priority,
    notes: "",
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const [tasks, customers] = await Promise.all([
        supabase
          .from("tasks")
          .select("*, customers(full_name, phone)")
          .order("due_date", { ascending: true }),
        supabase
          .from("customers")
          .select("id, full_name")
          .eq("is_archived", false)
          .order("full_name"),
      ]);
      if (tasks.error) throw tasks.error;
      return { tasks: tasks.data ?? [], customers: customers.data ?? [] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("أدخل عنوان المتابعة");
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("tasks").insert({
        title: form.title.trim(),
        task_type: form.task_type,
        customer_id: form.customer_id || null,
        due_date: form.due_date || null,
        priority: form.priority,
        notes: form.notes.trim() || null,
        status: "pending",
        created_by: auth.user?.id ?? null,
        assigned_to: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت إضافة المتابعة");
      setOpen(false);
      setForm({ ...form, title: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  const complete = useMutation({
    mutationFn: async (task: { id: string; title: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", task.id);
      if (error) throw error;
      await logActivity({
        entityType: "task",
        entityId: task.id,
        action: "completed",
        description: `تم إنهاء المتابعة: ${task.title}`,
      });
    },
    onSuccess: () => {
      toast.success("تم إنهاء المتابعة");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  const rows = useMemo(() => {
    const all = data?.tasks ?? [];
    if (filter === "open") return all.filter((t) => ["pending", "in_progress"].includes(t.status));
    if (filter === "overdue")
      return all.filter((t) => ["pending", "in_progress"].includes(t.status) && isOverdue(t.due_date));
    if (filter === "completed") return all.filter((t) => t.status === "completed");
    return all;
  }, [data, filter]);

  const openCount = (data?.tasks ?? []).filter((t) =>
    ["pending", "in_progress"].includes(t.status),
  ).length;
  const overdueCount = (data?.tasks ?? []).filter(
    (t) => ["pending", "in_progress"].includes(t.status) && isOverdue(t.due_date),
  ).length;

  return (
    <>
      <PageHeader
        title="المتابعات"
        subtitle="مهام التواصل مع العملاء ومواعيدها"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                متابعة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة متابعة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select
                    value={form.task_type}
                    onValueChange={(v) => setForm({ ...form, task_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>العميل</Label>
                  <Select
                    value={form.customer_id}
                    onValueChange={(v) => setForm({ ...form, customer_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختياري" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {(data?.customers ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>تاريخ الاستحقاق</Label>
                    <Input
                      type="date"
                      dir="ltr"
                      value={form.due_date}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الأولوية</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={create.isPending}>
                  حفظ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="متابعات مفتوحة" value={num(openCount)} tone="info" />
        <KpiCard label="متأخرة" value={num(overdueCount)} tone="danger" />
        <KpiCard
          label="مكتملة"
          value={num((data?.tasks ?? []).filter((t) => t.status === "completed").length)}
          tone="success"
        />
        <KpiCard label="الإجمالي" value={num(data?.tasks.length ?? 0)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { k: "open", l: "المفتوحة" },
          { k: "overdue", l: "المتأخرة" },
          { k: "completed", l: "المكتملة" },
          { k: "all", l: "الكل" },
        ].map((f) => (
          <Button
            key={f.k}
            size="sm"
            variant={filter === f.k ? "default" : "outline"}
            onClick={() => setFilter(f.k)}
          >
            {f.l}
          </Button>
        ))}
      </div>

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}
      {data && rows.length === 0 ? <EmptyState title="لا توجد متابعات في هذا التصنيف" /> : null}

      {rows.length > 0 ? (
        <SectionCard>
          <ul className="divide-y divide-border">
            {rows.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {TASK_TYPES[t.task_type] ?? t.task_type}
                    {(t.customers as { full_name: string } | null)?.full_name
                      ? ` · ${(t.customers as { full_name: string }).full_name}`
                      : ""}{" "}
                    · استحقاق {formatDate(t.due_date)}
                  </p>
                </div>
                {isOverdue(t.due_date) && t.status !== "completed" ? (
                  <StatusPill label="متأخرة" tone="danger" />
                ) : null}
                <StatusPill
                  label={PRIORITY[t.priority]?.label ?? t.priority}
                  tone={PRIORITY[t.priority]?.tone}
                />
                <StatusPill
                  label={TASK_STATUS[t.status]?.label ?? t.status}
                  tone={TASK_STATUS[t.status]?.tone}
                />
                {t.status !== "completed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => complete.mutate({ id: t.id, title: t.title })}
                  >
                    <CheckCircle2 className="size-4" />
                    إنهاء
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </>
  );
}
