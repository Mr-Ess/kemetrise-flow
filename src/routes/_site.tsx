import { createFileRoute, Outlet } from "@tanstack/react-router";

import { LanguageProvider } from "@/lib/i18n";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  return (
    <LanguageProvider>
      <Outlet />
    </LanguageProvider>
  );
}
