export function calculateGrowthPercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateProjectProgress(raised: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((raised / target) * 100)));
}

export function buildContributionReminder(projectTitle: string, paymentLink: string): string {
  return `Your giving can help ${projectTitle}. Contribute securely here: ${paymentLink}`;
}
