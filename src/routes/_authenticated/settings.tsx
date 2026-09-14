import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات | KemetRise" },
      { name: "description", content: "قواعد التسعير والاعتماد وصلاحيات المستخدمين." },
      { property: "og:title", content: "الإعدادات | KemetRise" },
      { property: "og:description", content: "ضبط قواعد العمل والصلاحيات في KemetRise." },
    ],
  }),
  component: SettingsPage,
});

type RulesForm = {
  min_margin: string;
  standard_margin: string;
  max_discount: string;
  approval_threshold: string;
  costing_sla_hours: string;
  approval_sla_hours: string;
  followup_sla_hours: string;
};

function SettingsPage() {
  const { isAdmin, isManager, profile } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RulesForm | null>(null);

  const rulesQuery = useQuery({
    queryKey: ["pricing-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["team"],
    enabled: isAdmin,
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      return (profiles.data ?? []).map((p) => ({
        ...p,
        role: roles.data?.find((r) => r.user_id === p.id)?.role ?? "staff",
      }));
    },
  });

  useEffect(() => {
    const r = rulesQuery.data;
    if (r && !form) {
      setForm({
        min_margin: String(r.min_margin ?? 15),
        standard_margin: String(r.standard_margin ?? 25),
        max_discount: String(r.max_discount ?? 10),
        approval_threshold: String(r.approval_threshold ?? 0),
        costing_sla_hours: String(r.costing_sla_hours ?? 48),
        approval_sla_hours: String(r.approval_sla_hours ?? 24),
        followup_sla_hours: String(r.followup_sla_hours ?? 72),
      });
    }
  }, [rulesQuery.data, form]);

  const saveRules = useMutation({
    mutationFn: async () => {
      if (!form || !rulesQuery.data) throw new Error("لا توجد قواعد محفوظة");
      const { error } = await supabase
        .from("pricing_rules")
        .update({
          min_margin: Number(form.min_margin),
          standard_margin: Number(form.standard_margin),
          max_discount: Number(form.max_discount),
          approval_threshold: Number(form.approval_threshold),
          costing_sla_hours: Number(form.costing_sla_hours),
          approval_sla_hours: Number(form.approval_sla_hours),
          followup_sla_hours: Number(form.followup_sla_hours),
        })
        .eq("id", rulesQuery.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ قواعد العمل");
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as "admin" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث الصلاحية");
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  if (!isManager) {
    return <EmptyState title="الإعدادات للإدارة فقط" description="لا تملك صلاحية عرض هذه الشاشة." />;
  }

  const fields: { key: keyof RulesForm; label: string; hint?: string }[] = [
    { key: "standard_margin", label: "هامش الربح الافتراضي %" },
    { key: "min_margin", label: "الحد الأدنى لهامش الربح %" },
    { key: "max_discount", label: "أقصى نسبة خصم %" },
    { key: "approval_threshold", label: "حد الاعتماد الإداري (ج.م)" },
    { key: "costing_sla_hours", label: "مهلة التسعير (ساعة)" },
    { key: "approval_sla_hours", label: "مهلة الاعتماد (ساعة)" },
    { key: "followup_sla_hours", label: "مهلة متابعة العرض (ساعة)" },
  ];

  return (
    <>
      <PageHeader title="الإعدادات" subtitle="قواعد التسعير والاعتماد وفريق العمل" />

      {rulesQuery.error ? (
        <ErrorState error={rulesQuery.error} onRetry={() => rulesQuery.refetch()} />
      ) : null}
      {rulesQuery.isLoading ? <LoadingState /> : null}

      {form ? (
        <SectionCard title="قواعد العمل والتسعير" className="mb-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {fields.map((f) => (
              <div key={f.key} className="grid gap-1.5">
                <Label>{f.label}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => saveRules.mutate()} disabled={saveRules.isPending}>
              حفظ القواعد
            </Button>
          </div>
        </SectionCard>
      ) : null}

      {isAdmin ? (
        <SectionCard title="فريق العمل والصلاحيات">
          {usersQuery.isLoading ? <LoadingState rows={3} /> : null}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="p-2 text-start">الاسم</th>
                  <th className="p-2 text-start">البريد</th>
                  <th className="p-2 text-start">تاريخ الانضمام</th>
                  <th className="p-2 text-start">الصلاحية</th>
                </tr>
              </thead>
              <tbody>
                {(usersQuery.data ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="p-2 font-medium">
                      {u.full_name ?? "—"}
                      {u.id === profile?.id ? (
                        <span className="ms-2 text-xs text-muted-foreground">(أنت)</span>
                      ) : null}
                    </td>
                    <td className="p-2 text-muted-foreground">{u.email}</td>
                    <td className="p-2 text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="p-2">
                      <Select
                        value={u.role}
                        onValueChange={(role) => changeRole.mutate({ userId: u.id, role })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}
    </>
  );
}
