export type Criticality =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical'

export interface Asset {
  id: string
  name: string
  category: string
  value: number // INR
  criticality: Criticality
  internetExposed: boolean
}

export interface Vulnerability {
  id: string
  assetId: string
  name: string
  cvss: number
  exploitAvailable: boolean
  controlEffectiveness: number // 0-1
  discoveredOn: string
}

export interface RiskItem {
  vulnerabilityId: string
  assetId: string
  assetName: string
  vulnerabilityName: string
  likelihood: number // 0-1
  residualRiskScore: number // 0-100
  eal: number // Expected Annual Loss, INR
  severity: Criticality
}

export interface Control {
  id: string
  name: string
  category: string
  cost: number // INR
  riskReductionPct: number // 0-1
}