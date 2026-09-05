export const CRITICALITY_WEIGHT: Record<string, number> = {
    Low: 0.25,
    Medium: 0.5,
    High: 0.75,
    Critical: 1.0,
}

export const RISK_WEIGHTS = {
    impact: 0.35,
    threat: 0.25,
    exposure: 0.15,
    exploitability: 0.25,
}

export const CONTROL_MAX_REDUCTION = 0.8

export const SEVERITY_THRESHOLDS = {
    critical: 75,
    high: 50,
    medium: 25,
}

export const PRIORITY_THRESHOLDS = {
    immediate: 75,
    high: 50,
    moderate: 25,
}