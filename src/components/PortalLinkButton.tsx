import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

function makeToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function PortalLinkButton({
  customerId,
  orderId,
  requestId,
  label = "رابط بوابة العميل",
}: {
  customerId: string;
  orderId?: string;
  requestId?: string;
  label?: string;
}) {
  const create = useMutation({
    mutationFn: async () => {
      const token = makeToken();
      const { data: auth } = await supabase.auth.getUser();
      const expires = new Date();
      expires.setDate(expires.getDate() + 60);
      const { error } = await supabase.from("portal_links").insert({
        token,
        customer_id: customerId,
        order_id: orderId ?? null,
        request_id: requestId ?? null,
        expires_at: expires.toISOString(),
        created_by: auth.user?.id ?? null,
      });
      if (error) throw error;
      return `${window.location.origin}/portal/${token}`;
    },
    onSuccess: async (url) => {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("تم إنشاء الرابط ونسخه", { description: url });
      } catch {
        toast.success("تم إنشاء الرابط", { description: url });
      }
    },
    onError: (e: Error) => toast.error("تعذّر إنشاء الرابط", { description: e.message }),
  });

  return (
    <Button size="sm" variant="outline" onClick={() => create.mutate()} disabled={create.isPending}>
      <Link2 className="size-4" />
      {label}
    </Button>
  );
}
