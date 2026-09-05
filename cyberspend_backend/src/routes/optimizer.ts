import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/index.js'
import { assets, vulnerabilities, controls } from '../db/schema.js'
import { calculateRisk } from '../lib/risk.js'
import { optimizeInvestment } from '../lib/optimizer.js'

export const optimizerRouter = Router()

const budgetInput = z.object({ budget: z.number().positive() })

// POST /api/optimizer  { budget: 5000000 }
optimizerRouter.post('/', async (req, res) => {
  const parsed = budgetInput.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const [assetRows, vulnRows, controlRows] = await Promise.all([
    db.select().from(assets),
    db.select().from(vulnerabilities),
    db.select().from(controls),
  ])

  const risks = calculateRisk(assetRows, vulnRows)
  const estimatedAnnualLoss = risks.reduce((sum, r) => sum + r.eal, 0)

  const result = optimizeInvestment(controlRows, parsed.data.budget, estimatedAnnualLoss)
  res.json({ ...result, estimatedAnnualLoss })
})

// What-if: pass an explicit list of control IDs to simulate "on", regardless of budget
const whatIfInput = z.object({ controlIds: z.array(z.string()) })

export const whatIfRouter = Router()

whatIfRouter.post('/', async (req, res) => {
  const parsed = whatIfInput.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const [assetRows, vulnRows, controlRows] = await Promise.all([
    db.select().from(assets),
    db.select().from(vulnerabilities),
    db.select().from(controls),
  ])

  const beforeRisks = calculateRisk(assetRows, vulnRows)
  const beforeEal = beforeRisks.reduce((sum, r) => sum + r.eal, 0)

  const selected = controlRows.filter((c) => parsed.data.controlIds.includes(c.id))
  const combinedReduction = 1 - selected.reduce((remaining, c) => remaining * (1 - c.riskReductionPct), 1)
  const totalCost = selected.reduce((sum, c) => sum + c.cost, 0)

  const afterEal = beforeEal * (1 - combinedReduction)
  const savings = beforeEal - afterEal

  res.json({
    selectedControls: selected,
    totalCost,
    beforeEal,
    afterEal,
    savings,
    rosi: totalCost > 0 ? (savings - totalCost) / totalCost : 0,
  })
})
