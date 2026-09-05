import type {
    AssetRow,
    VulnerabilityRow,
} from '../db/schema.js'

import type {
    RiskAssessment,
} from './risk.types.js'

import {
    RISK_WEIGHTS,
    CONTROL_MAX_REDUCTION,
} from './risk.weights.js'

import {
    clamp,
    criticalityFactor,
    cvssFactor,
    exposureFactor,
    exploitabilityFactor,
    vulnerabilityAgeFactor,
    severityFromScore,
    priorityFromScore,
    round,
} from './risk.utilis.js'

export function calculateCyberRisk(
    assets: AssetRow[],
    vulnerabilities: VulnerabilityRow[],
): RiskAssessment[] {
    const assetById = new Map(
        assets.map((asset) => [asset.id, asset]),
    )

    return vulnerabilities
        .map((vulnerability) => {
            const asset = assetById.get(vulnerability.assetId)

            if (!asset) {
                return null
            }

            /*
             * -----------------------------
             * 1. BASE FACTORS
             * -----------------------------
             */

            const criticality = criticalityFactor(
                asset.criticality,
            )

            const cvss = cvssFactor(
                vulnerability.cvss,
            )

            const exposure = exposureFactor(
                asset.internetExposed,
            )

            const exploitability =
                exploitabilityFactor(
                    vulnerability.exploitAvailable,
                )

            const age = vulnerabilityAgeFactor(
                vulnerability.discoveredOn,
            )

            /*
             * -----------------------------
             * 2. IMPACT
             * -----------------------------
             *
             * Business impact is primarily
             * determined by asset criticality
             * and business value.
             */

            const impactScore =
                criticality * 100

            /*
             * -----------------------------
             * 3. THREAT
             * -----------------------------
             *
             * Threat combines CVSS,
             * exploit availability and
             * vulnerability age.
             */

            const threatScore =
                (
                    cvss * 0.5 +
                    exploitability * 0.3 +
                    age * 0.2
                ) * 100

            /*
             * -----------------------------
             * 4. EXPOSURE
             * -----------------------------
             */

            const exposureScore =
                exposure * 100

            /*
             * -----------------------------
             * 5. EXPLOITABILITY
             * -----------------------------
             */

            const exploitabilityScore =
                (
                    cvss * 0.6 +
                    exploitability * 0.4
                ) * 100

            /*
             * -----------------------------
             * 6. INHERENT RISK
             * -----------------------------
             */

            const inherentRisk =
                impactScore * RISK_WEIGHTS.impact +
                threatScore * RISK_WEIGHTS.threat +
                exposureScore * RISK_WEIGHTS.exposure +
                exploitabilityScore *
                RISK_WEIGHTS.exploitability

            const inherentRiskScore = clamp(
                inherentRisk,
                0,
                100,
            )

            /*
             * -----------------------------
             * 7. CONTROL MITIGATION
             * -----------------------------
             *
             * controlEffectiveness is stored
             * between 0 and 1.
             *
             * Cap maximum reduction so that
             * controls never magically remove
             * 100% of cyber risk.
             */

            const rawControlEffectiveness =
                clamp(
                    vulnerability.controlEffectiveness,
                )

            const controlMitigation =
                Math.min(
                    rawControlEffectiveness,
                    CONTROL_MAX_REDUCTION,
                )

            /*
             * -----------------------------
             * 8. RESIDUAL RISK
             * -----------------------------
             */

            const residualRisk =
                inherentRiskScore *
                (1 - controlMitigation)

            const residualRiskScore = Math.round(
                clamp(residualRisk, 0, 100),
            )

            /*
             * -----------------------------
             * 9. LIKELIHOOD
             * -----------------------------
             *
             * Convert residual risk into
             * normalized likelihood.
             */

            const likelihood = clamp(
                residualRiskScore / 100,
            )

            /*
             * -----------------------------
             * 10. EXPECTED ANNUAL LOSS
             * -----------------------------
             *
             * EAL = Asset Value × Likelihood
             */

            const eal =
                asset.value * likelihood

            /*
             * -----------------------------
             * 11. CLASSIFICATION
             * -----------------------------
             */

            const severity =
                severityFromScore(
                    residualRiskScore,
                )

            const priority =
                priorityFromScore(
                    residualRiskScore,
                )

            const vulnerabilityAgeDays =
                Math.floor(
                    Math.max(
                        0,
                        (
                            Date.now() -
                            vulnerability.discoveredOn.getTime()
                        ) /
                        (1000 * 60 * 60 * 24),
                    ),
                )

            const result: RiskAssessment = {
                vulnerabilityId: vulnerability.id,
                assetId: asset.id,

                assetName: asset.name,
                vulnerabilityName: vulnerability.name,

                impactScore: round(impactScore),
                threatScore: round(threatScore),
                exposureScore: round(exposureScore),
                exploitabilityScore:
                    round(exploitabilityScore),

                controlMitigation:
                    round(controlMitigation * 100),

                inherentRiskScore:
                    round(inherentRiskScore),

                residualRiskScore,

                likelihood: round(likelihood, 4),

                eal: round(eal),

                severity,
                priority,

                factors: {
                    assetCriticality:
                        asset.criticality,

                    internetExposed:
                        asset.internetExposed,

                    exploitAvailable:
                        vulnerability.exploitAvailable,

                    vulnerabilityAgeDays,

                    cvss: vulnerability.cvss,

                    controlEffectiveness:
                        round(
                            vulnerability.controlEffectiveness,
                        ),
                },
            }

            return result
        })
        .filter(
            (
                item,
            ): item is RiskAssessment =>
                item !== null,
        )
        .sort(
            (a, b) =>
                b.residualRiskScore -
                a.residualRiskScore,
        )
}