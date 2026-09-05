import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { controls } from '../db/schema.js'

export const controlsRouter = Router()

const controlInput = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  cost: z.number().positive(),
  riskReductionPct: z.number().min(0).max(1),
})

controlsRouter.get('/', async (_req, res) => {
  const rows = await db.select().from(controls)
  res.json(rows)
})

controlsRouter.post('/', async (req, res) => {
  const parsed = controlInput.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const [row] = await db.insert(controls).values(parsed.data).returning()
  res.status(201).json(row)
})

controlsRouter.put('/:id', async (req, res) => {
  const parsed = controlInput.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const [row] = await db.update(controls).set(parsed.data).where(eq(controls.id, req.params.id)).returning()
  if (!row) return res.status(404).json({ error: 'Control not found' })
  res.json(row)
})

controlsRouter.delete('/:id', async (req, res) => {
  const [row] = await db.delete(controls).where(eq(controls.id, req.params.id)).returning()
  if (!row) return res.status(404).json({ error: 'Control not found' })
  res.status(204).send()
})
