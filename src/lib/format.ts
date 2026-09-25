export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startStr = start.toLocaleDateString("en-IN", { day: "numeric", month: sameMonth ? undefined : "short" });
  const endStr = end.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${startStr} – ${endStr}`;
}

export function formatDeadline(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}
