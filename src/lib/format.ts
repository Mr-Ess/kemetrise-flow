export function egp(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return (
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " ج.م"
  );
}

export function num(value: number | null | undefined, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value ?? 0));
}

export function pct(value: number | null | undefined): string {
  return `${num(value, 1)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/** Human age like "منذ 18 ساعة" / "منذ يومين" */
export function age(value: string | null | undefined): string {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (mins < 60) return `${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} يوم`;
  return `${Math.floor(days / 30)} شهر`;
}

export function hoursSince(value: string | null | undefined): number {
  if (!value) return 0;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return 0;
  return (Date.now() - then) / 3600000;
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false;
  return new Date(date).getTime() < Date.now() - 86400000;
}

/** Selling price from total cost and target gross margin: cost / (1 - margin%) */
export function priceFromMargin(totalCost: number, marginPct: number): number {
  const m = Math.min(Math.max(Number(marginPct) || 0, 0), 95) / 100;
  if (m >= 1) return totalCost;
  return Math.round((totalCost / (1 - m)) * 100) / 100;
}

/** Gross margin % implied by a selling price */
export function marginFromPrice(totalCost: number, price: number): number {
  if (!price) return 0;
  return Math.round(((price - totalCost) / price) * 1000) / 10;
}
