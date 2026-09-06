import { apiFetch } from './client'
import type { RiskItem } from '../types'

export interface RiskSummary {
    totalAssets: number
    totalVulnerabilities: number
    criticalVulnerabilities: number
    exploitableVulnerabilities: number
    overallRiskScore: number
    expectedAnnualLoss: number
    topRisks: RiskItem[]
}

export function getRiskSummary() {
    return apiFetch<RiskSummary>('/risk/summary')
}

export function getRisks() {
    return apiFetch<RiskItem[]>('/risk')
}