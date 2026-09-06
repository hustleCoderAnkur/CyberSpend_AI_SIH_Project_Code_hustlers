import { Router } from 'express'
import { z } from 'zod'

import { db } from '../db/index.js'
import {
    assets,
    vulnerabilities,
    controls,
    insiderThreatEvents,
} from '../db/schema.js'

export const importRouter = Router()

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

const insiderThreatSchema = z.object({
    id: z.string().min(1),

    employeeDepartment: z.string().min(1),
    employeeCampus: z.string().min(1),
    employeePosition: z.string().min(1),

    employeeSeniorityYears: z
        .number()
        .int()
        .nonnegative(),

    isContractor: z
        .number()
        .int()
        .min(0)
        .max(1),

    employeeClassification: z
        .number()
        .int(),

    hasForeignCitizenship: z
        .number()
        .int()
        .min(0)
        .max(1),

    hasCriminalRecord: z
        .number()
        .int()
        .min(0)
        .max(1),

    hasMedicalHistory: z
        .number()
        .int()
        .min(0)
        .max(1),

    employeeOriginCountry: z.string().min(1),

    totalPrintedPages: z
        .number()
        .int()
        .nonnegative(),

    numPrintedPagesOffHours: z
        .number()
        .int()
        .nonnegative(),

    totalFilesBurned: z
        .number()
        .int()
        .nonnegative(),

    burnedFromOther: z
        .number()
        .int()
        .min(0)
        .max(1),

    isAbroad: z
        .number()
        .int()
        .min(0)
        .max(1),

    tripDayNumber: z
        .number()
        .finite()
        .nullable()
        .optional(),

    hostilityCountryLevel: z
        .number()
        .int(),

    numEntries: z
        .number()
        .int()
        .nonnegative(),

    numUniqueCampus: z
        .number()
        .int()
        .nonnegative(),

    lateExitFlag: z
        .number()
        .int()
        .min(0)
        .max(1),

    entryDuringWeekend: z
        .number()
        .int()
        .min(0)
        .max(1),

    isMalicious: z.boolean(),
})

const importSchema = z.object({
    assets: z
        .array(assetSchema)
        .default([]),

    vulnerabilities: z
        .array(vulnerabilitySchema)
        .default([]),

    controls: z
        .array(controlSchema)
        .default([]),
})

/*
|--------------------------------------------------------------------------
| POST /api/import/validate
|--------------------------------------------------------------------------
*/

importRouter.post('/validate', async (req, res) => {
    const result = importSchema.safeParse(req.body)

    if (!result.success) {
        const errors = result.error.issues.map(
            (issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }),
        )

        return res.status(400).json({
            valid: false,
            errors,
        })
    }

    const data = result.data

    const assetIds = new Set<string>()
    const duplicateAssetIds: string[] = []

    for (const asset of data.assets) {
        if (assetIds.has(asset.id)) {
            duplicateAssetIds.push(asset.id)
        }

        assetIds.add(asset.id)
    }

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
                vulnerabilityId:
                    vulnerability.id,
                assetId:
                    vulnerability.assetId,
            }))

    const errors: Array<{
        field: string
        message: string
        details?: unknown
    }> = []

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
            details:
                missingAssetReferences,
        })
    }

    return res.json({
        valid: errors.length === 0,

        totalRows:
            data.assets.length +
            data.vulnerabilities.length +
            data.controls.length,

        assets: data.assets.length,

        vulnerabilities:
            data.vulnerabilities.length,

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
        const assetIds = new Set(
            data.assets.map((asset) => asset.id),
        )

        const missingAssetReferences =
            data.vulnerabilities.filter(
                (vulnerability) =>
                    !assetIds.has(
                        vulnerability.assetId,
                    ),
            )

        if (missingAssetReferences.length > 0) {
            return res.status(400).json({
                success: false,
                error:
                    'Some vulnerabilities reference assets that are not included in the import.',
                details:
                    missingAssetReferences.map(
                        (vulnerability) => ({
                            vulnerabilityId:
                                vulnerability.id,
                            assetId:
                                vulnerability.assetId,
                        }),
                    ),
            })
        }

        await db.transaction(async (tx) => {
            if (data.assets.length > 0) {
                await tx
                    .insert(assets)
                    .values(data.assets)
            }

            if (
                data.vulnerabilities.length > 0
            ) {
                await tx
                    .insert(vulnerabilities)
                    .values(
                        data.vulnerabilities,
                    )
            }

            if (data.controls.length > 0) {
                await tx
                    .insert(controls)
                    .values(data.controls)
            }
        })

        return res.status(201).json({
            success: true,
            message:
                'Company data imported successfully.',

            imported: {
                assets: data.assets.length,

                vulnerabilities:
                    data.vulnerabilities.length,

                controls:
                    data.controls.length,

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
            error:
                'Failed to import company data.',
        })
    }
})

/*
|--------------------------------------------------------------------------
| POST /api/import/insider-threat/validate
|--------------------------------------------------------------------------
*/

importRouter.post(
    '/insider-threat/validate',
    async (req, res) => {
        const result = z
            .array(insiderThreatSchema)
            .safeParse(req.body)

        if (!result.success) {
            const errors =
                result.error.issues.map(
                    (issue) => ({
                        field:
                            issue.path.join('.'),
                        message:
                            issue.message,
                    }),
                )

            return res.status(400).json({
                valid: false,
                errors,
            })
        }

        const data = result.data

        const ids = new Set<string>()
        const duplicateIds: string[] = []

        for (const row of data) {
            if (ids.has(row.id)) {
                duplicateIds.push(row.id)
            }

            ids.add(row.id)
        }

        const errors: Array<{
            field: string
            message: string
        }> = []

        if (duplicateIds.length > 0) {
            errors.push({
                field: 'id',
                message:
                    `Duplicate insider threat IDs: ${duplicateIds.join(', ')}`,
            })
        }

        return res.json({
            valid: errors.length === 0,
            totalRows: data.length,
            insiderThreatEvents:
                data.length,
            errors,
        })
    },
)

/*
|--------------------------------------------------------------------------
| POST /api/import/insider-threat
|--------------------------------------------------------------------------
*/

importRouter.post(
    '/insider-threat',
    async (req, res) => {
        const result = z
            .array(insiderThreatSchema)
            .safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error.flatten(),
            })
        }

        const data = result.data

        try {
            const ids = new Set<string>()
            const duplicateIds: string[] = []

            for (const row of data) {
                if (ids.has(row.id)) {
                    duplicateIds.push(row.id)
                }

                ids.add(row.id)
            }

            if (duplicateIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    error:
                        'Duplicate insider threat IDs found in the import.',
                    details: duplicateIds,
                })
            }

            await db.transaction(async (tx) => {
                if (data.length > 0) {
                    await tx
                        .insert(
                            insiderThreatEvents,
                        )
                        .values(data)
                }
            })

            return res.status(201).json({
                success: true,
                message:
                    'Insider threat data imported successfully.',

                imported: {
                    insiderThreatEvents:
                        data.length,

                    total: data.length,
                },
            })
        } catch (error) {
            console.error(
                'Insider threat import failed:',
                error,
            )

            return res.status(500).json({
                success: false,
                error:
                    'Failed to import insider threat data.',
            })
        }
    },
)