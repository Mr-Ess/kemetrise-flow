import { cn } from "@/lib/utils";

export function BrandMark({
  size = "md",
  withText = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  className?: string;
}) {
  const box = size === "lg" ? "size-12 text-xl" : size === "sm" ? "size-8 text-sm" : "size-10 text-base";
  const title = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "brand-gradient flex items-center justify-center rounded-xl font-extrabold text-primary-foreground",
          box,
        )}
        aria-hidden="true"
      >
        K
      </span>
      {withText ? (
        <span className="leading-tight">
          <span className={cn("block font-extrabold tracking-tight", title)}>KemetRise</span>
          <span className="block text-[11px] text-muted-foreground">
            نظام العملاء والمبيعات
          </span>
        </span>
      ) : null}
    </div>
  );
}
