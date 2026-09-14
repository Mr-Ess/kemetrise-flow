import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PAYMENT_METHODS } from "@/lib/constants";
import { InlineLoading, SectionCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type { Database } from "@/integrations/supabase/types";

type Method = Database["public"]["Enums"]["payment_method"];

export function PaymentGatewaysCard() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    key: "",
    name: "",
    method: "other" as Method,
    instructions: "",
    account_ref: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["payment-gateways"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_gateways")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["payment-gateways"] });

  const update = useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Partial<Database["public"]["Tables"]["payment_gateways"]["Update"]>;
    }) => {
      const { error } = await supabase
        .from("payment_gateways")
        .update(input.patch)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.key.trim() || !form.name.trim()) throw new Error("أدخل الاسم والمعرّف");
      const { error } = await supabase.from("payment_gateways").insert({
        key: form.key.trim(),
        name: form.name.trim(),
        method: form.method,
        instructions: form.instructions || null,
        account_ref: form.account_ref || null,
        sort_order: (data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت إضافة طريقة الدفع");
      setOpen(false);
      setForm({ key: "", name: "", method: "other", instructions: "", account_ref: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  return (
    <SectionCard
      title="طرق الدفع الإلكتروني"
      className="mb-4"
      actions={
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          طريقة جديدة
        </Button>
      }
    >
      {isLoading ? <InlineLoading /> : null}
      <ul className="divide-y divide-border">
        {(data ?? []).map((g) => (
          <li key={g.id} className="space-y-2 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold">{g.name}</p>
              <span className="text-xs text-muted-foreground">
                {PAYMENT_METHODS[g.method] ?? g.method}
              </span>
              <label className="ms-auto flex items-center gap-2 text-xs">
                مفعّلة
                <Switch
                  checked={g.is_active}
                  onCheckedChange={(v) => update.mutate({ id: g.id, patch: { is_active: v } })}
                />
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                defaultValue={g.account_ref ?? ""}
                placeholder="رقم الحساب / المحفظة"
                dir="ltr"
                onBlur={(e) =>
                  e.target.value !== (g.account_ref ?? "") &&
                  update.mutate({ id: g.id, patch: { account_ref: e.target.value } })
                }
              />
              <Input
                defaultValue={g.instructions ?? ""}
                placeholder="تعليمات تظهر للعميل"
                onBlur={(e) =>
                  e.target.value !== (g.instructions ?? "") &&
                  update.mutate({ id: g.id, patch: { instructions: e.target.value } })
                }
              />
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة طريقة دفع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم المعروض</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المعرّف (بالإنجليزية)</Label>
              <Input
                dir="ltr"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="fawry"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع الدفع</Label>
              <Select
                value={form.method}
                onValueChange={(v) => setForm({ ...form, method: v as Method })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رقم الحساب / المحفظة</Label>
              <Input
                dir="ltr"
                value={form.account_ref}
                onChange={(e) => setForm({ ...form, account_ref: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>تعليمات للعميل</Label>
              <Textarea
                rows={2}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
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
    </SectionCard>
  );
}
