import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { convertContactMessage } from "@/lib/site.functions";
import { formatDateTime } from "@/lib/format";
import { ContentManager } from "@/components/website/ContentManager";
import { CategoriesManager } from "@/components/website/CategoriesManager";
import {
  EmptyState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MSG_STATUS: Record<string, { label: string; tone?: "info" | "warning" | "success" | "danger" }> = {
  new: { label: "جديدة", tone: "info" },
  in_progress: { label: "قيد المعالجة", tone: "warning" },
  converted: { label: "تحوّلت لطلب", tone: "success" },
  closed: { label: "مغلقة" },
};

export const Route = createFileRoute("/_authenticated/website")({
  head: () => ({
    meta: [
      { title: "إدارة الموقع | KemetRise" },
      {
        name: "description",
        content: "إدارة محتوى موقع KemetRise وصندوق وارد رسائل الزوار وتحويلها إلى طلبات بيع.",
      },
      { property: "og:title", content: "إدارة الموقع | KemetRise" },
      { property: "og:description", content: "محتوى الموقع ورسائل الزوار في مكان واحد." },
    ],
  }),
  component: WebsiteAdminPage,
});

function WebsiteAdminPage() {
  return (
    <>
      <PageHeader
        title="الموقع العام"
        subtitle="محتوى الموقع ورسائل الزوار وتحويلها إلى طلبات بيع"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/">
              <ExternalLink className="size-4" />
              عرض الموقع
            </Link>
          </Button>
        }
      />
      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">الرسائل</TabsTrigger>
          <TabsTrigger value="content">المحتوى</TabsTrigger>
          <TabsTrigger value="categories">التصنيفات</TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="mt-4">
          <MessagesInbox />
        </TabsContent>
        <TabsContent value="content" className="mt-4">
          <SectionCard title="محتوى الموقع">
            <ContentManager />
          </SectionCard>
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <SectionCard title="قوائم التصنيفات">
            <CategoriesManager />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </>
  );
}

function MessagesInbox() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const convert = useServerFn(convertContactMessage);
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("website_contact_submissions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
    },
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  const toRequest = useMutation({
    mutationFn: (id: string) => convert({ data: { id } }),
    onSuccess: (res) => {
      toast.success("تم تحويل الرسالة إلى طلب بيع");
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      navigate({ to: "/requests/$id", params: { id: res.requestId as string } });
    },
    onError: (e: Error) => toast.error("تعذّر التحويل", { description: e.message }),
  });

  const rows = (data ?? []).filter((m) => filter === "all" || m.status === filter);

  return (
    <SectionCard
      title="صندوق وارد الموقع"
      actions={
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الرسائل</SelectItem>
            <SelectItem value="new">جديدة</SelectItem>
            <SelectItem value="in_progress">قيد المعالجة</SelectItem>
            <SelectItem value="converted">تحوّلت لطلب</SelectItem>
            <SelectItem value="closed">مغلقة</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {isLoading ? <LoadingState rows={4} /> : null}
      {!isLoading && rows.length === 0 ? (
        <EmptyState title="لا توجد رسائل" description="رسائل نموذج «تواصل معنا» تظهر هنا." />
      ) : null}

      <ul className="divide-y divide-border">
        {rows.map((m) => (
          <li key={m.id} className="py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="size-4 text-muted-foreground" />
                  {m.full_name}
                  <StatusPill
                    label={MSG_STATUS[m.status]?.label ?? m.status}
                    tone={MSG_STATUS[m.status]?.tone}
                  />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.subject || "بدون موضوع"} · <span className="num">{m.phone ?? "—"}</span> ·{" "}
                  {m.email ?? "—"} · {formatDateTime(m.created_at)}
                </p>
                <p className="mt-2 max-w-3xl text-sm whitespace-pre-line">{m.message}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {m.request_id ? (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/requests/$id" params={{ id: m.request_id }}>
                      فتح الطلب
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={toRequest.isPending}
                    onClick={() => toRequest.mutate(m.id)}
                  >
                    تحويل إلى طلب
                  </Button>
                )}
                {m.status !== "closed" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus.mutate({ id: m.id, status: "closed" })}
                  >
                    إغلاق
                  </Button>
                ) : null}
                {m.status === "new" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus.mutate({ id: m.id, status: "in_progress" })}
                  >
                    قيد المعالجة
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
