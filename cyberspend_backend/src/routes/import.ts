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

/*
|--------------------------------------------------------------------------
| IMPORT DEBUG LOGGING
|--------------------------------------------------------------------------
|
| Detailed logs are enabled for every major stage of this route.
| Large payloads are summarized instead of dumping the whole dataset.
|
*/

const IMPORT_LOG_PREFIX = '[CyberSpend Import]'

function importLog(message: string, data?: unknown) {
    const timestamp = new Date().toISOString()

    if (data === undefined) {
        console.log(`${IMPORT_LOG_PREFIX} ${timestamp} ${message}`)
    } else {
        console.log(
            `${IMPORT_LOG_PREFIX} ${timestamp} ${message}`,
            data,
        )
    }
}

function importError(message: string, error?: unknown) {
    const timestamp = new Date().toISOString()

    console.error(
        `${IMPORT_LOG_PREFIX} ${timestamp} ${message}`,
        error ?? '',
    )
}

function logBodySummary(body: unknown) {
    if (Array.isArray(body)) {
        return {
            type: 'array',
            length: body.length,
            firstRowKeys:
                body.length > 0 &&
                    body[0] &&
                    typeof body[0] === 'object'
                    ? Object.keys(
                        body[0] as Record<string, unknown>,
                    )
                    : [],
        }
    }

    if (body && typeof body === 'object') {
        return {
            type: 'object',
            keys: Object.keys(
                body as Record<string, unknown>,
            ),
        }
    }

    return {
        type: typeof body,
    }
}

function logCompanyPayload(payload: unknown) {
    if (
        !payload ||
        typeof payload !== 'object' ||
        Array.isArray(payload)
    ) {
        return logBodySummary(payload)
    }

    const value =
        payload as Record<string, unknown>

    return {
        assets: Array.isArray(value.assets)
            ? value.assets.length
            : 'NOT_ARRAY',
        vulnerabilities:
            Array.isArray(value.vulnerabilities)
                ? value.vulnerabilities.length
                : 'NOT_ARRAY',
        controls: Array.isArray(value.controls)
            ? value.controls.length
            : 'NOT_ARRAY',

        firstAsset:
            Array.isArray(value.assets) &&
                value.assets.length > 0
                ? value.assets[0]
                : null,

        firstVulnerability:
            Array.isArray(value.vulnerabilities) &&
                value.vulnerabilities.length > 0
                ? value.vulnerabilities[0]
                : null,

        firstControl:
            Array.isArray(value.controls) &&
                value.controls.length > 0
                ? value.controls[0]
                : null,
    }
}

importLog('import.ts module loaded')

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toNumber(value: unknown): number {
    // Per-row values are intentionally not logged.
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0
    }

    const parsed = Number(
        String(value ?? '')
            .replace(/,/g, '')
            .replace(/%/g, '')
            .trim(),
    )

    return Number.isFinite(parsed) ? parsed : 0
}

function toInteger(value: unknown): number {
    return Math.trunc(toNumber(value))
}

function toBinary(value: unknown): number {
    if (typeof value === 'boolean') {
        return value ? 1 : 0
    }

    const normalized = String(value ?? '')
        .trim()
        .toLowerCase()

    if (
        normalized === 'true' ||
        normalized === 'yes' ||
        normalized === 'y' ||
        normalized === '1'
    ) {
        return 1
    }

    return 0
}

function toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value
    }

    const normalized = String(value ?? '')
        .trim()
        .toLowerCase()

    return (
        normalized === 'true' ||
        normalized === 'yes' ||
        normalized === 'y' ||
        normalized === '1'
    )
}

function toText(value: unknown): string {
    return String(value ?? '').trim()
}

function toNullableNumber(value: unknown): number | null {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    ) {
        return null
    }

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
}

/*
|--------------------------------------------------------------------------
| Request normalization
|--------------------------------------------------------------------------
|
| Accept both the current frontend payload and common wrapped/legacy
| payloads so old and new frontend builds cannot trigger a false 400.
|--------------------------------------------------------------------------
*/

function extractArrayPayload(body: unknown): Record<string, unknown>[] | null {
    importLog('extractArrayPayload() called', logBodySummary(body))

    if (Array.isArray(body)) {
        return body as Record<string, unknown>[]
    }

    if (!body || typeof body !== 'object') {
        return null
    }

    const value = body as Record<string, unknown>

    const candidates = [
        value.data,
        value.rows,
        value.payload,
        value.insiderThreat,
        value.insiderThreatData,
        value.insiderThreatEvents,
        value.records,
        value.items,
    ]

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate as Record<string, unknown>[]
        }
    }

    // Accept a single insider row as a one-record import.
    if (
        'employeeDepartment' in value ||
        'employee_department' in value ||
        'employeePosition' in value ||
        'employee_position' in value
    ) {
        return [value]
    }

    return null
}

function extractCompanyPayload(body: unknown): unknown {
    importLog('extractCompanyPayload() called', logBodySummary(body))

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return body
    }

    const value = body as Record<string, unknown>

    for (const key of ['payload', 'data', 'company', 'importData']) {
        const candidate = value[key]

        if (
            candidate &&
            typeof candidate === 'object' &&
            !Array.isArray(candidate)
        ) {
            const object = candidate as Record<string, unknown>

            if (
                'assets' in object ||
                'vulnerabilities' in object ||
                'controls' in object
            ) {
                return candidate
            }
        }
    }

    return body
}

function parseBooleanValue(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value
    }

    const normalized = String(value ?? '')
        .trim()
        .toLowerCase()

    return ['true', '1', 'yes', 'y', 'on'].includes(normalized)
}

function parseCriticalityValue(
    value: unknown,
): 'Low' | 'Medium' | 'High' | 'Critical' {
    const normalized = String(value ?? '')
        .trim()
        .toLowerCase()

    if (normalized === 'critical') return 'Critical'
    if (normalized === 'high') return 'High'
    if (normalized === 'medium') return 'Medium'
    return 'Low'
}

/*
|--------------------------------------------------------------------------
| Company Data Schemas
|--------------------------------------------------------------------------
*/

const assetSchema = z.object({
    id: z.preprocess((value) => toText(value), z.string().min(1)),
    name: z.preprocess((value) => toText(value), z.string().min(1)),
    category: z.preprocess((value) => toText(value), z.string().min(1)),
    value: z.preprocess(
        (value) => toNumber(value),
        z.number().finite().nonnegative(),
    ),
    criticality: z.preprocess(
        parseCriticalityValue,
        z.enum(['Low', 'Medium', 'High', 'Critical']),
    ),
    internetExposed: z.preprocess(parseBooleanValue, z.boolean()),
})

const vulnerabilitySchema = z.object({
    id: z.preprocess((value) => toText(value), z.string().min(1)),
    assetId: z.preprocess((value) => toText(value), z.string().min(1)),
    name: z.preprocess((value) => toText(value), z.string().min(1)),
    cvss: z.preprocess(
        (value) => toNumber(value),
        z.number().finite().min(0).max(10),
    ),
    exploitAvailable: z.preprocess(parseBooleanValue, z.boolean()),
    controlEffectiveness: z.preprocess(
        (value) => toNumber(value),
        z.number().finite().min(0).max(1),
    ),
    discoveredOn: z.coerce.date(),
})

const controlSchema = z.object({
    id: z.preprocess((value) => toText(value), z.string().min(1)),
    name: z.preprocess((value) => toText(value), z.string().min(1)),
    category: z.preprocess((value) => toText(value), z.string().min(1)),
    cost: z.preprocess(
        (value) => toNumber(value),
        z.number().finite().nonnegative(),
    ),
    riskReductionPct: z.preprocess(
        (value) => toNumber(value),
        z.number().finite().min(0).max(1),
    ),
})

const importSchema = z.object({
    assets: z.array(assetSchema).default([]),
    vulnerabilities: z.array(vulnerabilitySchema).default([]),
    controls: z.array(controlSchema).default([]),
})

/*
|--------------------------------------------------------------------------
| Insider Threat Normalization
|--------------------------------------------------------------------------
*/

function normalizeInsiderThreatRow(
    row: Record<string, unknown>,
    index: number,
) {
    // Do not log every row; routes log counts and representative records.
    return {
        id:
            toText(row.id) ||
            `INS-${String(index + 1).padStart(6, '0')}`,

        employeeDepartment: toText(
            row.employeeDepartment,
        ),

        employeeCampus: toText(
            row.employeeCampus,
        ),

        employeePosition: toText(
            row.employeePosition,
        ),

        employeeSeniorityYears: toInteger(
            row.employeeSeniorityYears,
        ),

        isContractor: toBinary(
            row.isContractor,
        ),

        employeeClassification: toInteger(
            row.employeeClassification,
        ),

        hasForeignCitizenship: toBinary(
            row.hasForeignCitizenship,
        ),

        hasCriminalRecord: toBinary(
            row.hasCriminalRecord,
        ),

        hasMedicalHistory: toBinary(
            row.hasMedicalHistory,
        ),

        employeeOriginCountry: toText(
            row.employeeOriginCountry,
        ),

        totalPrintedPages: toInteger(
            row.totalPrintedPages,
        ),

        numPrintedPagesOffHours: toInteger(
            row.numPrintedPagesOffHours,
        ),

        totalFilesBurned: toInteger(
            row.totalFilesBurned,
        ),

        burnedFromOther: toBinary(
            row.burnedFromOther,
        ),

        isAbroad: toBinary(
            row.isAbroad,
        ),

        tripDayNumber: toNullableNumber(
            row.tripDayNumber,
        ),

        hostilityCountryLevel: toInteger(
            row.hostilityCountryLevel,
        ),

        numEntries: toInteger(
            row.numEntries,
        ),

        numUniqueCampus: toInteger(
            row.numUniqueCampus,
        ),

        lateExitFlag: toBinary(
            row.lateExitFlag,
        ),

        entryDuringWeekend: toBinary(
            row.entryDuringWeekend,
        ),

        isMalicious: toBoolean(
            row.isMalicious,
        ),
    }
}

/*
|--------------------------------------------------------------------------
| Insider Threat Validation
|--------------------------------------------------------------------------
*/

function validateInsiderThreatRows(
    rows: Record<string, unknown>[],
) {
    importLog('validateInsiderThreatRows() START', {
        rows: rows.length,
    })

    const errors: Array<{
        field: string
        message: string
        details?: unknown
    }> = []

    const ids = new Set<string>()

    rows.forEach((rawRow, index) => {
        const rowNumber = index + 2

        const row = normalizeInsiderThreatRow(
            rawRow,
            index,
        )

        if (!row.employeeDepartment) {
            errors.push({
                field: `rows.${index}.employeeDepartment`,
                message: `Row ${rowNumber}: employee department is required.`,
            })
        }

        if (!row.employeeCampus) {
            errors.push({
                field: `rows.${index}.employeeCampus`,
                message: `Row ${rowNumber}: employee campus is required.`,
            })
        }

        if (!row.employeePosition) {
            errors.push({
                field: `rows.${index}.employeePosition`,
                message: `Row ${rowNumber}: employee position is required.`,
            })
        }

        if (!row.employeeOriginCountry) {
            errors.push({
                field: `rows.${index}.employeeOriginCountry`,
                message: `Row ${rowNumber}: employee origin country is required.`,
            })
        }

        if (ids.has(row.id)) {
            errors.push({
                field: `rows.${index}.id`,
                message: `Row ${rowNumber}: duplicate ID "${row.id}".`,
            })
        }

        ids.add(row.id)
    })

    importLog('validateInsiderThreatRows() END', {
        rows: rows.length,
        errors: errors.length,
        firstErrors: errors.slice(0, 5),
    })

    return errors
}

/*
|--------------------------------------------------------------------------
| POST /api/import/validate
|--------------------------------------------------------------------------
*/

importRouter.post(
    '/validate',
    async (req, res) => {
        const startedAt = Date.now()

        importLog('================================================')
        importLog('POST /api/import/validate START')
        importLog('Request body', logBodySummary(req.body))

        try {
            const payload =
                extractCompanyPayload(req.body)

            importLog(
                'Company validation payload extracted',
                logCompanyPayload(payload),
            )

            importLog('Running company Zod validation')

            const result =
                importSchema.safeParse(payload)

            if (!result.success) {
                importError(
                    '❌ COMPANY VALIDATION FAILED',
                    result.error.issues,
                )
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

            const assetIds = new Set<string>()

            const duplicateAssetIds: string[] = []

            for (const asset of data.assets) {
                if (assetIds.has(asset.id)) {
                    duplicateAssetIds.push(
                        asset.id,
                    )
                }

                assetIds.add(asset.id)
            }

            const missingAssetReferences =
                data.vulnerabilities
                    .filter(
                        (vulnerability) =>
                            !assetIds.has(
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
                    message:
                        `Duplicate asset IDs: ${duplicateAssetIds.join(', ')}`,
                })
            }

            if (
                missingAssetReferences.length >
                0
            ) {
                errors.push({
                    field:
                        'vulnerabilities.assetId',
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

                controls:
                    data.controls.length,

                errors,
            })
        } catch (error) {
            console.error(
                'Company validation failed:',
                error,
            )

            return res.status(500).json({
                valid: false,
                errors: [
                    {
                        field: 'server',
                        message:
                            'Company data validation failed.',
                    },
                ],
            })
        }
    },
)

/*
|--------------------------------------------------------------------------
| POST /api/import
|--------------------------------------------------------------------------
*/

importRouter.post(
    '/',
    async (req, res) => {
        const startedAt = Date.now()

        importLog('================================================')
        importLog('POST /api/import START')
        importLog('Request body', logBodySummary(req.body))

        try {
            const payload =
                extractCompanyPayload(req.body)

            importLog(
                'Company import payload extracted',
                logCompanyPayload(payload),
            )

            importLog('Running company Zod validation')

            const result =
                importSchema.safeParse(payload)

            if (!result.success) {
                importError(
                    '❌ COMPANY IMPORT ZOD VALIDATION FAILED',
                    result.error.issues,
                )

                return res.status(400).json({
                    success: false,
                    message: 'Company data validation failed.',
                    error: result.error.flatten(),
                    details: result.error.issues.map(
                        (issue) => ({
                            path: issue.path,
                            field: issue.path.join('.'),
                            code: issue.code,
                            message: issue.message,
                            received: issue.input,
                        }),
                    ),
                })
            }

            const data = result.data

            importLog('✅ COMPANY ZOD VALIDATION PASSED', {
                assets: data.assets.length,
                vulnerabilities: data.vulnerabilities.length,
                controls: data.controls.length,
            })

            const assetIds = new Set(
                data.assets.map(
                    (asset) => asset.id,
                ),
            )

            importLog(
                'Checking vulnerability -> asset relationships',
                {
                    assets: data.assets.length,
                    vulnerabilities:
                        data.vulnerabilities.length,
                },
            )

            const missingAssetReferences =
                data.vulnerabilities.filter(
                    (vulnerability) =>
                        !assetIds.has(
                            vulnerability.assetId,
                        ),
                )

            if (
                missingAssetReferences.length >
                0
            ) {
                importError(
                    '❌ MISSING ASSET REFERENCES',
                    missingAssetReferences.map(
                        (vulnerability) => ({
                            vulnerabilityId:
                                vulnerability.id,
                            assetId:
                                vulnerability.assetId,
                        }),
                    ),
                )

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

            importLog(
                'Starting company database transaction',
            )

            await db.transaction(
                async (tx) => {
                    if (
                        data.assets.length >
                        0
                    ) {
                        importLog(
                            `DB INSERT START: ${data.assets.length} assets`,
                            data.assets[0],
                        )

                        await tx
                            .insert(assets)
                            .values(
                                data.assets,
                            )
                            .onConflictDoNothing()
                    }

                    if (
                        data.vulnerabilities
                            .length > 0
                    ) {
                        importLog(
                            `DB INSERT START: ${data.vulnerabilities.length} vulnerabilities`,
                            data.vulnerabilities[0],
                        )

                        await tx
                            .insert(
                                vulnerabilities,
                            )
                            .values(
                                data.vulnerabilities,
                            )
                            .onConflictDoNothing()
                    }

                    if (
                        data.controls.length >
                        0
                    ) {
                        importLog(
                            `DB INSERT START: ${data.controls.length} controls`,
                            data.controls[0],
                        )

                        await tx
                            .insert(controls)
                            .values(
                                data.controls,
                            )
                            .onConflictDoNothing()

                        importLog(
                            'DB INSERT COMPLETE: controls',
                        )
                    }
                },
            )

            importLog(
                '✅ COMPANY DATABASE TRANSACTION COMPLETE',
            )

            return res.status(201).json({
                success: true,

                message:
                    'Company data imported successfully.',

                imported: {
                    assets:
                        data.assets.length,

                    vulnerabilities:
                        data.vulnerabilities
                            .length,

                    controls:
                        data.controls.length,

                    total:
                        data.assets.length +
                        data.vulnerabilities
                            .length +
                        data.controls.length,
                },
            })
        } catch (error) {
            importError(
                '❌ COMPANY IMPORT FAILED',
                error,
            )

            if (error instanceof Error) {
                importError(
                    'Company error message',
                    error.message,
                )

                importError(
                    'Company error stack',
                    error.stack,
                )
            }

            return res.status(500).json({
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to import company data.',
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            })
        } finally {
            importLog(
                'POST /api/import FINISHED',
                {
                    durationMs:
                        Date.now() - startedAt,
                },
            )
        }
    },
)

/*
|--------------------------------------------------------------------------
| POST /api/import/insider-threat/validate
|--------------------------------------------------------------------------
|
| Kept for frontend compatibility.
| It NO LONGER uses strict raw Zod validation.
|--------------------------------------------------------------------------
*/

importRouter.post(
    '/insider-threat/validate',
    async (req, res) => {
        const startedAt = Date.now()

        importLog('================================================')
        importLog('POST /api/import/insider-threat/validate START')
        importLog('Request body', logBodySummary(req.body))

        try {
            const rawData =
                extractArrayPayload(req.body)

            importLog(
                'Insider validation payload extracted',
                Array.isArray(rawData)
                    ? {
                        rows: rawData.length,
                        firstRow:
                            rawData[0] ?? null,
                    }
                    : {
                        isArray: false,
                    },
            )

            if (!rawData) {
                importError(
                    '❌ INSIDER VALIDATION PAYLOAD IS NOT AN ARRAY',
                )
                return res.status(400).json({
                    valid: false,
                    totalRows: 0,
                    insiderThreatEvents: 0,
                    errors: [
                        {
                            field: 'body',
                            message:
                                'Insider threat data must be an array.',
                        },
                    ],
                })
            }

            const rows =
                rawData as Record<
                    string,
                    unknown
                >[]

            const errors =
                validateInsiderThreatRows(
                    rows,
                )

            return res.json({
                valid: errors.length === 0,

                totalRows: rows.length,

                insiderThreatEvents:
                    rows.length,

                errors,
            })
        } catch (error) {
            console.error(
                'Insider threat validation failed:',
                error,
            )

            return res.status(500).json({
                valid: false,
                totalRows: 0,
                insiderThreatEvents: 0,
                errors: [
                    {
                        field: 'server',
                        message:
                            'Insider threat validation failed.',
                    },
                ],
            })
        }
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
        const startedAt = Date.now()

        importLog('================================================')
        importLog('POST /api/import/insider-threat START')
        importLog('Request body', logBodySummary(req.body))

        try {
            const rawData =
                extractArrayPayload(req.body)

            importLog(
                'Insider import payload extracted',
                Array.isArray(rawData)
                    ? {
                        rows: rawData.length,
                        firstRow:
                            rawData[0] ?? null,
                    }
                    : {
                        isArray: false,
                    },
            )

            if (!rawData) {
                importError(
                    '❌ INSIDER IMPORT PAYLOAD IS NOT AN ARRAY',
                )

                return res.status(400).json({
                    success: false,
                    message:
                        'Insider threat data must be an array.',
                    error:
                        'Insider threat data must be an array.',
                })
            }

            const rawRows =
                rawData as Record<
                    string,
                    unknown
                >[]

            if (rawRows.length === 0) {
                return res.status(400).json({
                    success: false,
                    error:
                        'No insider threat records were provided.',
                })
            }

            importLog(
                'Validating insider threat rows',
                {
                    rows: rawRows.length,
                },
            )

            const validationErrors =
                validateInsiderThreatRows(
                    rawRows,
                )

            if (
                validationErrors.length > 0
            ) {
                importError(
                    '❌ INSIDER VALIDATION FAILED',
                    validationErrors.slice(0, 20),
                )
                return res.status(400).json({
                    success: false,
                    error:
                        'Some insider threat records are invalid.',
                    details:
                        validationErrors.slice(
                            0,
                            20,
                        ),
                })
            }

            const rows =
                rawRows.map(
                    (row, index) =>
                        normalizeInsiderThreatRow(
                            row,
                            index,
                        ),
                )

            importLog(
                'Starting insider threat database transaction',
            )

            await db.transaction(
                async (tx) => {
                    importLog(
                        `DB INSERT START: ${rows.length} insider threat events`,
                        rows[0] ?? null,
                    )

                    await tx
                        .insert(
                            insiderThreatEvents,
                        )
                        .values(rows)
                        .onConflictDoNothing()

                    importLog(
                        'DB INSERT COMPLETE: insider threat events',
                    )
                },
            )

            importLog(
                '✅ INSIDER DATABASE TRANSACTION COMPLETE',
            )

            return res.status(201).json({
                success: true,

                message:
                    'Insider threat data imported successfully.',

                imported: {
                    insiderThreatEvents:
                        rows.length,

                    total: rows.length,
                },
            })
        } catch (error) {
            importError(
                '❌ INSIDER THREAT IMPORT FAILED',
                error,
            )

            if (error instanceof Error) {
                importError(
                    'Insider error message',
                    error.message,
                )

                importError(
                    'Insider error stack',
                    error.stack,
                )
            }

            return res.status(500).json({
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to import insider threat data.',
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            })
        } finally {
            importLog(
                'POST /api/import/insider-threat FINISHED',
                {
                    durationMs:
                        Date.now() - startedAt,
                },
            )
        }
    },
)