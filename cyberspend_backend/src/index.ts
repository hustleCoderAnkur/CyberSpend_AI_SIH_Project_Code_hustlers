import { config } from 'dotenv'
config({ path: '.env.local' })
import express from 'express'
import cors from 'cors'
import { assetsRouter } from './routes/assets.js'
import { vulnerabilitiesRouter } from './routes/vulnerabilities.js'
import { controlsRouter } from './routes/controls.js'
import { riskRouter } from './routes/risk.js'
import { optimizerRouter, whatIfRouter } from './routes/optimizer.js'
import { complianceRouter } from './routes/compliance.js'
import { importRouter } from './routes/import.js'

const app = express()

const PORT = process.env.PORT ?? 4000
const CORS_ORIGIN = process.env.CORS_ORIGIN 

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cyberspend-ai-backend' })
})

app.use('/api/assets', assetsRouter)
app.use('/api/vulnerabilities', vulnerabilitiesRouter)
app.use('/api/controls', controlsRouter)
app.use('/api/risk', riskRouter)
app.use('/api/optimizer', optimizerRouter)
app.use('/api/what-if', whatIfRouter)
app.use('/api/compliance', complianceRouter)
app.use('/api/import', importRouter)

// Central error handler — keep last
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`CyberSpend AI backend running on http://localhost:${PORT}`)
})
