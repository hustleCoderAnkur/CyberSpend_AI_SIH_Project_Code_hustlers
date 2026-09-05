import type { ControlRow } from '../db/schema.js'

export interface OptimizerResult {
  recommendedControls: ControlRow[]
  totalCost: number
  totalRiskReductionPct: number
  budget: number
  remainingBudget: number
  rosi: number // Return on Security Investment
}

/**
 * 0/1 knapsack: pick the subset of controls that maximizes total risk
 * reduction (%) without exceeding the budget. Costs are rounded to the
 * nearest 10,000 INR to keep the DP table small for a prototype.
 */
export function optimizeInvestment(
  controls: ControlRow[],
  budget: number,
  estimatedAnnualLoss: number,
): OptimizerResult {
  const UNIT = 10_000
  const capacity = Math.floor(budget / UNIT)
  const weights = controls.map((c) => Math.max(1, Math.round(c.cost / UNIT)))
  const values = controls.map((c) => c.riskReductionPct)
  const n = controls.length

  // dp[i][w] = max risk reduction using first i controls within weight w
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0))

  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1]!
    const v = values[i - 1]!
    for (let c = 0; c <= capacity; c++) {
      dp[i]![c] = dp[i - 1]![c]!
      if (w <= c) {
        dp[i]![c] = Math.max(dp[i]![c]!, dp[i - 1]![c - w]! + v)
      }
    }
  }

  // backtrack to find which controls were chosen
  const chosen: ControlRow[] = []
  let c = capacity
  for (let i = n; i > 0; i--) {
    if (dp[i]![c] !== dp[i - 1]![c]) {
      chosen.push(controls[i - 1]!)
      c -= weights[i - 1]!
    }
  }
  chosen.reverse()

  const totalCost = chosen.reduce((sum, ctrl) => sum + ctrl.cost, 0)
  // Diminishing returns: reductions don't simply add past 100%, so cap and
  // apply them multiplicatively against remaining risk.
  const totalRiskReductionPct = 1 - chosen.reduce((remaining, ctrl) => remaining * (1 - ctrl.riskReductionPct), 1)
  const riskReductionValue = estimatedAnnualLoss * totalRiskReductionPct
  const rosi = totalCost > 0 ? (riskReductionValue - totalCost) / totalCost : 0

  return {
    recommendedControls: chosen,
    totalCost,
    totalRiskReductionPct,
    budget,
    remainingBudget: budget - totalCost,
    rosi,
  }
}
