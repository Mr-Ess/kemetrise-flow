import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  portalAcceptByToken,
  portalChangeByToken,
  portalLoadByToken,
  portalPayByToken,
} from "@/lib/portal.functions";
import { CustomerPortalView } from "@/components/CustomerPortalView";
import { ErrorState, LoadingState } from "@/components/ui-kit";

export const Route = createFileRoute("/portal/$token")({
  head: () => ({
    meta: [
      { title: "متابعة طلبك | KemetRise" },
      {
        name: "description",
        content: "تابع عرض السعر ومراحل تنفيذ أوردرك وادفع إلكترونيًا من مكان واحد.",
      },
      { property: "og:title", content: "متابعة طلبك | KemetRise" },
      {
        property: "og:description",
        content: "بوابة عملاء KemetRise: عروض الأسعار، التنفيذ، والمدفوعات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortalByToken,
});

function PortalByToken() {
  const { token } = Route.useParams();
  const queryClient = useQueryClient();
  const load = useServerFn(portalLoadByToken);
  const change = useServerFn(portalChangeByToken);
  const accept = useServerFn(portalAcceptByToken);
  const payFn = useServerFn(portalPayByToken);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["portal", token],
    queryFn: () => load({ data: { token } }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal", token] });

  const changeM = useMutation({
    mutationFn: (input: Parameters<typeof change>[0]["data"]) => change({ data: input }),
    onSuccess: () => {
      toast.success("تم إرسال طلب التعديل لفريق المبيعات");
      refresh();
    },
    onError: (e: Error) => toast.error("تعذّر الإرسال", { description: e.message }),
  });

  const acceptM = useMutation({
    mutationFn: (quotationId: string) => accept({ data: { token, quotationId } }),
    onSuccess: () => {
      toast.success("تم تسجيل موافقتك على العرض");
      refresh();
    },
    onError: (e: Error) => toast.error("تعذّر التنفيذ", { description: e.message }),
  });

  const payM = useMutation({
    mutationFn: (input: Parameters<typeof payFn>[0]["data"]) => payFn({ data: input }),
    onSuccess: () => {
      toast.success("تم استلام بيانات الدفع", { description: "سيتم اعتمادها بعد المراجعة." });
      refresh();
    },
    onError: (e: Error) => toast.error("تعذّر تسجيل الدفع", { description: e.message }),
  });

  if (isLoading)
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <LoadingState rows={6} />
      </div>
    );
  if (error || !data)
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );

  return (
    <CustomerPortalView
      data={data}
      busy={changeM.isPending || acceptM.isPending || payM.isPending}
      onChangeRequest={(input) => changeM.mutateAsync({ ...input, token })}
      onAccept={(quotationId) => acceptM.mutateAsync(quotationId)}
      onPay={(input) => payM.mutateAsync({ ...input, token })}
    />
  );
}
