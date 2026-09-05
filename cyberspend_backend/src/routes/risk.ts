import { Router } from 'express'
import { db } from '../db/index.js'
import {
  assets,
  vulnerabilities,
} from '../db/schema.js'
import { calculateRisk } from '../lib/risk.js'

export const riskRouter = Router()

riskRouter.get('/', async (_req, res, next) => {
  try {
    const [assetRows, vulnRows] =
      await Promise.all([
        db.select().from(assets),
        db.select().from(vulnerabilities),
      ])

    const risks = calculateRisk(
      assetRows,
      vulnRows,
    )

    res.json(risks)
  } catch (error) {
    next(error)
  }
})

riskRouter.get(
  '/summary',
  async (_req, res, next) => {
    try {
      const [assetRows, vulnRows] =
        await Promise.all([
          db.select().from(assets),
          db.select().from(vulnerabilities),
        ])

      const risks = calculateRisk(
        assetRows,
        vulnRows,
      )

      const totalEal = risks.reduce(
        (sum, risk) =>
          sum + risk.eal,
        0,
      )

      const overallRiskScore =
        risks.length
          ? Math.round(
            risks.reduce(
              (sum, risk) =>
                sum +
                risk.residualRiskScore,
              0,
            ) / risks.length,
          )
          : 0

      const criticalCount =
        risks.filter(
          (risk) =>
            risk.severity === 'Critical',
        ).length

      const highCount =
        risks.filter(
          (risk) =>
            risk.severity === 'High',
        ).length

      const immediateCount =
        risks.filter(
          (risk) =>
            risk.priority === 'Immediate',
        ).length

      res.json({
        totalAssets: assetRows.length,

        totalVulnerabilities:
          vulnRows.length,

        criticalVulnerabilities:
          criticalCount,

        highRiskVulnerabilities:
          highCount,

        exploitableVulnerabilities:
          vulnRows.filter(
            (vulnerability) =>
              vulnerability.exploitAvailable,
          ).length,

        immediatePriorityRisks:
          immediateCount,

        overallRiskScore,

        expectedAnnualLoss:
          totalEal,

        topRisks:
          risks.slice(0, 5),
      })
    } catch (error) {
      next(error)
    }
  },
)