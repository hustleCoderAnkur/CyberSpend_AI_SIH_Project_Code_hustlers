import {
    CRITICALITY_WEIGHT,
    SEVERITY_THRESHOLDS,
    PRIORITY_THRESHOLDS,
} from './risk.weights.js'

export function clamp(
    value: number,
    min = 0,
    max = 1,
): number {
    return Math.min(Math.max(value, min), max)
}

export function criticalityFactor(
    criticality: string,
): number {
    return CRITICALITY_WEIGHT[criticality] ?? 0.25
}

export function cvssFactor(cvss: number): number {
    return clamp(cvss / 10)
}

export function exposureFactor(
    internetExposed: boolean,
): number {
    return internetExposed ? 1 : 0.45
}

export function exploitabilityFactor(
    exploitAvailable: boolean,
): number {
    return exploitAvailable ? 1 : 0.5
}

export function vulnerabilityAgeFactor(
    discoveredOn: Date,
): number {
    const ageMs = Date.now() - discoveredOn.getTime()
    const ageDays = Math.max(
        0,
        ageMs / (1000 * 60 * 60 * 24),
    )

    /*
     * New vulnerabilities have less historical exposure.
     * Older vulnerabilities gradually reach maximum age risk.
     */
    return clamp(ageDays / 180)
}

export function severityFromScore(
    score: number,
): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (score >= SEVERITY_THRESHOLDS.critical) {
        return 'Critical'
    }

    if (score >= SEVERITY_THRESHOLDS.high) {
        return 'High'
    }

    if (score >= SEVERITY_THRESHOLDS.medium) {
        return 'Medium'
    }

    return 'Low'
}

export function priorityFromScore(
    score: number,
): 'Low' | 'Moderate' | 'High' | 'Immediate' {
    if (score >= PRIORITY_THRESHOLDS.immediate) {
        return 'Immediate'
    }

    if (score >= PRIORITY_THRESHOLDS.high) {
        return 'High'
    }

    if (score >= PRIORITY_THRESHOLDS.moderate) {
        return 'Moderate'
    }

    return 'Low'
}

export function round(value: number, decimals = 2): number {
    const multiplier = 10 ** decimals
    return Math.round(value * multiplier) / multiplier
}