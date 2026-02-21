export function calculateSourcingFeeChf(budgetChf: number): number {
  return Math.max(50, Number((budgetChf * 0.1).toFixed(2)));
}
