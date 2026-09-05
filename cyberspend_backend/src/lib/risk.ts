import type {
  AssetRow,
  VulnerabilityRow,
} from '../db/schema.js'

import {
  calculateCyberRisk,
} from '../engine/risk.engine.js'

export type {
  RiskAssessment as RiskItem,
} from '../engine/risk.types.js'

export function calculateRisk(
  assets: AssetRow[],
  vulnerabilities: VulnerabilityRow[],
) {
  return calculateCyberRisk(
    assets,
    vulnerabilities,
  )
}