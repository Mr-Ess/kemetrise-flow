import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { siteContentQuery } from "@/lib/site.functions";

export const Route = createFileRoute("/_site")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  component: SiteLayout,
});

function SiteLayout() {
  const { data } = useSuspenseQuery(siteContentQuery);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter settings={data.settings} />
    </div>
  );
}
