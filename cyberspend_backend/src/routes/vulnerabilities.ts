import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { vulnerabilities } from '../db/schema.js'

export const vulnerabilitiesRouter = Router()

const vulnInput = z.object({
  id: z.string(),
  assetId: z.string(),
  name: z.string(),
  cvss: z.number().min(0).max(10),
  exploitAvailable: z.boolean(),
  controlEffectiveness: z.number().min(0).max(1),
})

vulnerabilitiesRouter.get('/', async (_req, res) => {
  const rows = await db.select().from(vulnerabilities)
  res.json(rows)
})

vulnerabilitiesRouter.post('/', async (req, res) => {
  const parsed = vulnInput.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const [row] = await db.insert(vulnerabilities).values(parsed.data).returning()
  res.status(201).json(row)
})

// Bulk import for CSV/JSON upload flows
vulnerabilitiesRouter.post('/import', async (req, res) => {
  const parsed = z.array(vulnInput).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const rows = await db.insert(vulnerabilities).values(parsed.data).returning()
  res.status(201).json(rows)
})

vulnerabilitiesRouter.put('/:id', async (req, res) => {
  const parsed = vulnInput.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const [row] = await db
    .update(vulnerabilities)
    .set(parsed.data)
    .where(eq(vulnerabilities.id, req.params.id))
    .returning()
  if (!row) return res.status(404).json({ error: 'Vulnerability not found' })
  res.json(row)
})

vulnerabilitiesRouter.delete('/:id', async (req, res) => {
  const [row] = await db.delete(vulnerabilities).where(eq(vulnerabilities.id, req.params.id)).returning()
  if (!row) return res.status(404).json({ error: 'Vulnerability not found' })
  res.status(204).send()
})
