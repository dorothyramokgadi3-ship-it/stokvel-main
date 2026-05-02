export function formatCents(cents: number): string {
  const rands = cents / 100;
  return "R" + rands.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}
