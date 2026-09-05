import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { assets } from '../db/schema.js'

export const assetsRouter = Router()

const assetInput = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  value: z.number().positive(),
  criticality: z.enum(['Low', 'Medium', 'High', 'Critical']),
  internetExposed: z.boolean(),
})

assetsRouter.get('/', async (_req, res) => {
  const rows = await db.select().from(assets)
  res.json(rows)
})

assetsRouter.get('/:id', async (req, res) => {
  const [row] = await db.select().from(assets).where(eq(assets.id, req.params.id))
  if (!row) return res.status(404).json({ error: 'Asset not found' })
  res.json(row)
})

assetsRouter.post('/', async (req, res) => {
  const parsed = assetInput.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const [row] = await db.insert(assets).values(parsed.data).returning()
  res.status(201).json(row)
})

assetsRouter.put('/:id', async (req, res) => {
  const parsed = assetInput.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const [row] = await db.update(assets).set(parsed.data).where(eq(assets.id, req.params.id)).returning()
  if (!row) return res.status(404).json({ error: 'Asset not found' })
  res.json(row)
})

assetsRouter.delete('/:id', async (req, res) => {
  const [row] = await db.delete(assets).where(eq(assets.id, req.params.id)).returning()
  if (!row) return res.status(404).json({ error: 'Asset not found' })
  res.status(204).send()
})
