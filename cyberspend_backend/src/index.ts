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

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: CORS_ORIGIN || true,
  }),
)

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
|
| Frontend sends JSON using:
| Content-Type: application/json
|
| The insider-threat dataset can be large, so keep a generous limit.
|
*/

app.use(
  express.json({
    limit: '25mb',
  }),
)

app.use(
  express.urlencoded({
    extended: true,
    limit: '25mb',
  }),
)

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'cyberspend-ai-backend',
  })
})

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/assets', assetsRouter)

app.use(
  '/api/vulnerabilities',
  vulnerabilitiesRouter,
)

app.use('/api/controls', controlsRouter)

app.use('/api/risk', riskRouter)

app.use('/api/optimizer', optimizerRouter)

app.use('/api/what-if', whatIfRouter)

app.use('/api/compliance', complianceRouter)

app.use('/api/import', importRouter)

/*
|--------------------------------------------------------------------------
| Central Error Handler
|--------------------------------------------------------------------------
|
| This must remain AFTER all routes.
|
*/

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(
      '[CyberSpend API] Unhandled error:',
      err,
    )

    if (err instanceof Error) {
      console.error(
        '[CyberSpend API] Error message:',
        err.message,
      )

      console.error(
        '[CyberSpend API] Error stack:',
        err.stack,
      )
    }

    res.status(500).json({
      error: 'Internal server error',
      message:
        err instanceof Error
          ? err.message
          : String(err),
    })
  },
)

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(
    `CyberSpend AI backend running on http://localhost:${PORT}`,
  )

  console.log(
    `[CyberSpend API] JSON body limit: 25mb`,
  )

  console.log(
    `[CyberSpend API] CORS origin: ${CORS_ORIGIN || 'all origins'}`,
  )
})