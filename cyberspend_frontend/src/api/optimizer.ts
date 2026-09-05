import { apiFetch } from './client'

export interface OptimizerControl {
    id: string
    name: string
    category: string
    cost: number
    riskReductionPct: number
    createdAt?: string
}

export interface OptimizerResult {
    recommendedControls: OptimizerControl[]
    totalCost: number
    totalRiskReductionPct: number
    budget: number
    remainingBudget: number
    rosi: number
    estimatedAnnualLoss: number
}

export function optimizeInvestment(budget: number) {
    return apiFetch<OptimizerResult>('/optimizer', {
        method: 'POST',
        body: JSON.stringify({
            budget,
        }),
    })
}