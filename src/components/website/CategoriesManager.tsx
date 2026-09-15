import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_KINDS, categoriesQueryKey, fetchCategories, type CategoryRow } from "@/lib/categories";
import { EmptyState, LoadingState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Draft = Partial<CategoryRow> & { kind: string };

export function CategoriesManager() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<string>(CATEGORY_KINDS[0]!.kind);
  const [editing, setEditing] = useState<Draft | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: categoriesQueryKey(kind),
    queryFn: () => fetchCategories(kind),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["website-categories"] });
  };

  const save = useMutation({
    mutationFn: async (row: Draft) => {
      const payload = {
        kind: row.kind,
        value: (row.value ?? row.label_ar ?? "").toString().trim(),
        label_ar: (row.label_ar ?? "").toString().trim(),
        label_en: row.label_en || null,
        description: row.description || null,
        sort_order: Number(row.sort_order ?? 0),
        is_active: row.is_active ?? true,
      };
      if (!payload.label_ar) throw new Error("الاسم مطلوب");
      const res = row.id
        ? await supabase.from("website_categories").update(payload).eq("id", row.id)
        : await supabase.from("website_categories").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("تم الحفظ");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("website_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      invalidate();
    },
    onError: (e: Error) => toast.error("تعذّر الحذف", { description: e.message }),
  });

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        التصنيفات هنا تظهر كقوائم اختيار في محتوى الموقع ونماذج الطلبات، حتى لا تُكتب يدويًا بصيغ
        مختلفة.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_KINDS.map((k) => (
              <SelectItem key={k.kind} value={k.kind}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setEditing({ kind, is_active: true, sort_order: rows.length + 1 })}>
          <Plus className="size-4" />
          إضافة تصنيف
        </Button>
      </div>

      {isLoading ? <LoadingState rows={3} /> : null}
      {!isLoading && rows.length === 0 ? (
        <EmptyState title="لا توجد تصنيفات" description="أضف أول تصنيف لهذه القائمة." />
      ) : null}

      <ul className="divide-y divide-border rounded-xl border border-border">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {c.label_ar}
                {c.is_active ? null : <span className="ms-2 text-xs text-muted-foreground">(معطّل)</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {c.label_en || "—"} · <span className="num">{c.sort_order}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => setEditing(c)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="حذف"
                onClick={() => remove.mutate(c.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تصنيف</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(editing);
              }}
            >
              <div className="sm:col-span-2">
                <Label>الاسم بالعربية</Label>
                <Input
                  value={editing.label_ar ?? ""}
                  onChange={(e) => setEditing({ ...editing, label_ar: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>الاسم بالإنجليزية</Label>
                <Input
                  value={editing.label_en ?? ""}
                  onChange={(e) => setEditing({ ...editing, label_en: e.target.value })}
                />
              </div>
              <div>
                <Label>القيمة المخزّنة</Label>
                <Input
                  value={editing.value ?? ""}
                  placeholder="تُملأ تلقائيًا من الاسم"
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                />
              </div>
              <div>
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  className="num"
                  value={String(editing.sort_order ?? 0)}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <Label>مفعّل</Label>
                <Switch
                  checked={editing.is_active ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
