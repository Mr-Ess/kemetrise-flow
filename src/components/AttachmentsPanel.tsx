import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Paperclip, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineLoading, SectionCard } from "@/components/ui-kit";

export function AttachmentsPanel({ requestId }: { requestId: string }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const key = ["attachments", requestId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_request_attachments")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("الجلسة غير صالحة");
      const path = `${uid}/${requestId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("sales_request_attachments").insert({
        request_id: requestId,
        file_name: file.name,
        file_path: path,
        file_type: file.type || null,
        uploaded_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم رفع الملف");
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error("تعذّر رفع الملف", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (row: { id: string; file_path: string }) => {
      await supabase.storage.from("attachments").remove([row.file_path]);
      const { error } = await supabase
        .from("sales_request_attachments")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error("تعذّر الحذف", { description: e.message }),
  });

  async function openFile(path: string) {
    setBusy(true);
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(path, 300);
    setBusy(false);
    if (error || !data) {
      toast.error("تعذّر فتح الملف");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <SectionCard
      title="المرفقات"
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Paperclip className="size-4" />
            رفع ملف
          </Button>
        </>
      }
    >
      {isLoading ? <InlineLoading /> : null}
      {data && data.length === 0 ? (
        <EmptyState title="لا توجد مرفقات" description="ارفع صور المرجع أو الرسومات الفنية." />
      ) : null}
      <ul className="divide-y divide-border">
        {(data ?? []).map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm">{a.file_name}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                disabled={busy}
                onClick={() => openFile(a.file_path)}
                aria-label="تحميل"
              >
                <Download className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove.mutate({ id: a.id, file_path: a.file_path })}
                aria-label="حذف"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
