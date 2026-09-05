export type RiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export type RiskPriority = 'Low' | 'Moderate' | 'High' | 'Immediate'

export interface RiskAssessment {
    vulnerabilityId: string
    assetId: string

    assetName: string
    vulnerabilityName: string

    impactScore: number
    threatScore: number
    exposureScore: number
    exploitabilityScore: number
    controlMitigation: number

    inherentRiskScore: number
    residualRiskScore: number

    likelihood: number
    eal: number

    severity: RiskSeverity
    priority: RiskPriority

    factors: {
        assetCriticality: string
        internetExposed: boolean
        exploitAvailable: boolean
        vulnerabilityAgeDays: number
        cvss: number
        controlEffectiveness: number
    }
}