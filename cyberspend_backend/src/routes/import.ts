import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/index.js'
import {
    assets,
    vulnerabilities,
    controls,
} from '../db/schema.js'

export const importRouter = Router()

/*
|--------------------------------------------------------------------------
| Validation Schemas
|--------------------------------------------------------------------------
*/

const assetSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    value: z.number().nonnegative(),
    criticality: z.enum([
        'Low',
        'Medium',
        'High',
        'Critical',
    ]),
    internetExposed: z.boolean(),
})

const vulnerabilitySchema = z.object({
    id: z.string().min(1),
    assetId: z.string().min(1),
    name: z.string().min(1),
    cvss: z.number().min(0).max(10),
    exploitAvailable: z.boolean(),
    controlEffectiveness: z.number().min(0).max(1),
    discoveredOn: z.coerce.date(),
})

const controlSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    cost: z.number().nonnegative(),
    riskReductionPct: z.number().min(0).max(1),
})

const importSchema = z.object({
    assets: z.array(assetSchema).default([]),
    vulnerabilities: z
        .array(vulnerabilitySchema)
        .default([]),
    controls: z.array(controlSchema).default([]),
})

/*
|--------------------------------------------------------------------------
| POST /api/import/validate
|--------------------------------------------------------------------------
*/

importRouter.post('/validate', async (req, res) => {
    const result = importSchema.safeParse(req.body)

    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }))

        return res.status(400).json({
            valid: false,
            errors,
        })
    }

    const data = result.data

    /*
     * Check duplicate IDs inside uploaded data
     */

    const assetIds = new Set<string>()
    const duplicateAssetIds: string[] = []

    for (const asset of data.assets) {
        if (assetIds.has(asset.id)) {
            duplicateAssetIds.push(asset.id)
        }

        assetIds.add(asset.id)
    }

    /*
     * Check vulnerability -> asset relationship
     */

    const uploadedAssetIds = new Set(
        data.assets.map((asset) => asset.id),
    )

    const missingAssetReferences =
        data.vulnerabilities
            .filter(
                (vulnerability) =>
                    !uploadedAssetIds.has(
                        vulnerability.assetId,
                    ),
            )
            .map((vulnerability) => ({
                vulnerabilityId: vulnerability.id,
                assetId: vulnerability.assetId,
            }))

    const errors = []

    if (duplicateAssetIds.length > 0) {
        errors.push({
            field: 'assets.id',
            message: `Duplicate asset IDs: ${duplicateAssetIds.join(', ')}`,
        })
    }

    if (missingAssetReferences.length > 0) {
        errors.push({
            field: 'vulnerabilities.assetId',
            message:
                'Some vulnerabilities reference assets that are not present in the uploaded data.',
            details: missingAssetReferences,
        })
    }

    return res.json({
        valid: errors.length === 0,
        totalRows:
            data.assets.length +
            data.vulnerabilities.length +
            data.controls.length,
        assets: data.assets.length,
        vulnerabilities: data.vulnerabilities.length,
        controls: data.controls.length,
        errors,
    })
})

/*
|--------------------------------------------------------------------------
| POST /api/import
|--------------------------------------------------------------------------
*/

importRouter.post('/', async (req, res) => {
    const result = importSchema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({
            success: false,
            error: result.error.flatten(),
        })
    }

    const data = result.data

    try {
        /*
         * Validate asset references before touching DB
         */

        const assetIds = new Set(
            data.assets.map((asset) => asset.id),
        )

        const missingAssetReferences =
            data.vulnerabilities.filter(
                (vulnerability) =>
                    !assetIds.has(vulnerability.assetId),
            )

        if (missingAssetReferences.length > 0) {
            return res.status(400).json({
                success: false,
                error:
                    'Some vulnerabilities reference assets that are not included in the import.',
                details: missingAssetReferences.map(
                    (vulnerability) => ({
                        vulnerabilityId: vulnerability.id,
                        assetId: vulnerability.assetId,
                    }),
                ),
            })
        }

        /*
         * Transaction
         *
         * If anything fails, all inserts are rolled back.
         */

        await db.transaction(async (tx) => {
            /*
             * Assets first because vulnerabilities
             * have a foreign key to assets.
             */

            if (data.assets.length > 0) {
                await tx.insert(assets).values(data.assets)
            }

            /*
             * Vulnerabilities second.
             */

            if (data.vulnerabilities.length > 0) {
                await tx
                    .insert(vulnerabilities)
                    .values(data.vulnerabilities)
            }

            /*
             * Controls are independent.
             */

            if (data.controls.length > 0) {
                await tx.insert(controls).values(data.controls)
            }
        })

        return res.status(201).json({
            success: true,
            message: 'Company data imported successfully.',
            imported: {
                assets: data.assets.length,
                vulnerabilities:
                    data.vulnerabilities.length,
                controls: data.controls.length,
                total:
                    data.assets.length +
                    data.vulnerabilities.length +
                    data.controls.length,
            },
        })
    } catch (error) {
        console.error(
            'Company data import failed:',
            error,
        )

        return res.status(500).json({
            success: false,
            error: 'Failed to import company data.',
        })
    }
})