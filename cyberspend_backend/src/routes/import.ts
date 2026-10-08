import { Router } from 'express'

import {
    importCompanyData,
    validateCompanyData,
    importRawFile,
    validateRawFile,
    importMixedRawFile,
    validateMixedRawFile,
} from '../import/import.service.js'

import type {
    ImportServiceInput,
    RawImportRow,
} from '../import/import.types.js'

export const importRouter = Router()

type UnknownRecord = Record<string, unknown>

function isRecord(
    value: unknown,
): value is UnknownRecord {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    )
}

function extractArray(
    value: unknown,
): RawImportRow[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value.filter(
        (item): item is RawImportRow =>
            isRecord(item),
    )
}

function extractCompanyPayload(
    body: unknown,
): ImportServiceInput {
    if (!isRecord(body)) {
        return {}
    }

    let source: UnknownRecord = body

    for (const key of [
        'payload',
        'data',
        'company',
        'importData',
    ]) {
        const candidate = body[key]

        if (isRecord(candidate)) {
            source = candidate
            break
        }
    }

    return {
        assets: extractArray(source.assets),

        vulnerabilities: extractArray(
            source.vulnerabilities,
        ),

        controls: extractArray(
            source.controls,
        ),

        insiderThreat: extractArray(
            source.insiderThreat,
        ),

        insiderThreatEvents: extractArray(
            source.insiderThreatEvents,
        ),
    }
}

function extractInsiderThreatPayload(
    body: unknown,
): RawImportRow[] {
    if (Array.isArray(body)) {
        return extractArray(body)
    }

    if (!isRecord(body)) {
        return []
    }

    const candidates = [
        body.data,
        body.rows,
        body.payload,
        body.insiderThreat,
        body.insiderThreatData,
        body.insiderThreatEvents,
        body.records,
        body.items,
    ]

    for (const candidate of candidates) {
        const rows = extractArray(candidate)

        if (rows.length > 0) {
            return rows
        }
    }

    if (
        'employeeDepartment' in body ||
        'employee_department' in body ||
        'employeePosition' in body ||
        'employee_position' in body
    ) {
        return [body]
    }

    return []
}

/* -------------------------------------------------------------------------- */
/* Raw file helpers                                                           */
/* -------------------------------------------------------------------------- */

interface RawFileRequest {
    filename: string
    content: string
}

function extractRawFilePayload(
    body: unknown,
): RawFileRequest | null {
    if (!isRecord(body)) {
        return null
    }

    const filename = body.filename
    const content = body.content

    if (
        typeof filename !== 'string' ||
        filename.trim() === ''
    ) {
        return null
    }

    if (
        typeof content !== 'string' ||
        content.trim() === ''
    ) {
        return null
    }

    return {
        filename: filename.trim(),
        content,
    }
}

function getRawFileError(
    error: unknown,
    fallback: string,
) {
    return {
        field: 'file',
        message:
            error instanceof Error
                ? error.message
                : fallback,
    }
}

/* -------------------------------------------------------------------------- */
/* POST /api/import/file/validate                                             */
/* -------------------------------------------------------------------------- */

importRouter.post(
    '/file/validate',
    async (req, res) => {
        try {
            const file =
                extractRawFilePayload(req.body)

            if (!file) {
                return res.status(400).json({
                    valid: false,

                    detection: {
                        type: null,
                        confidence: 0,
                        matchedFields: [],
                    },

                    errors: [
                        {
                            field: 'file',
                            message:
                                'A valid filename and file content are required.',
                        },
                    ],
                })
            }

            const result =
                await validateRawFile(file)

            return res.json({
                valid: result.success,

                detection:
                    result.detection,

                totalRows:
                    result.imported.total,

                assets:
                    result.imported.assets,

                vulnerabilities:
                    result.imported.vulnerabilities,

                controls:
                    result.imported.controls,

                insiderThreatEvents:
                    result.imported.insiderThreat,

                createdAssets:
                    result.created.assets,

                errors:
                    result.errors,
            })
        } catch (error) {
            return res.status(400).json({
                valid: false,

                detection: {
                    type: null,
                    confidence: 0,
                    matchedFields: [],
                },

                errors: [
                    getRawFileError(
                        error,
                        'Raw file validation failed.',
                    ),
                ],
            })
        }
    },
)

/* -------------------------------------------------------------------------- */
/* POST /api/import/file                                                      */
/* -------------------------------------------------------------------------- */

importRouter.post(
    '/file',
    async (req, res) => {
        try {
            const file =
                extractRawFilePayload(req.body)

            if (!file) {
                return res.status(400).json({
                    success: false,

                    message:
                        'A valid filename and file content are required.',

                    errors: [
                        {
                            field: 'file',
                            message:
                                'Expected { filename, content }.',
                        },
                    ],
                })
            }

            const result =
                await importRawFile(file)

            if (!result.success) {
                return res.status(400).json({
                    success: false,

                    message:
                        'Raw cybersecurity file import failed.',

                    detection:
                        result.detection,

                    imported:
                        result.imported,

                    created:
                        result.created,

                    errors:
                        result.errors,
                })
            }

            return res.status(201).json({
                success: true,

                message:
                    'Cybersecurity data file imported successfully.',

                detection:
                    result.detection,

                imported: {
                    assets:
                        result.imported.assets,

                    vulnerabilities:
                        result.imported.vulnerabilities,

                    controls:
                        result.imported.controls,

                    insiderThreatEvents:
                        result.imported.insiderThreat,

                    total:
                        result.imported.total,
                },

                created: {
                    assets:
                        result.created.assets,
                },

                errors: [],
            })
        } catch (error) {
            return res.status(500).json({
                success: false,

                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to import cybersecurity file.',

                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            })
        }
    },
)

/* -------------------------------------------------------------------------- */
/* POST /api/import/file/mixed/validate                                       */
/* -------------------------------------------------------------------------- */

importRouter.post(
    '/file/mixed/validate',
    async (req, res) => {
        try {
            const file =
                extractRawFilePayload(req.body)

            if (!file) {
                return res.status(400).json({
                    valid: false,

                    detection: {
                        type: null,
                        confidence: 0,
                        matchedFields: [],
                    },

                    errors: [
                        {
                            field: 'file',
                            message:
                                'A valid filename and file content are required.',
                        },
                    ],
                })
            }

            const result =
                await validateMixedRawFile(file)

            return res.json({
                valid: result.success,

                detection:
                    result.detection,

                totalRows:
                    result.imported.total,

                assets:
                    result.imported.assets,

                vulnerabilities:
                    result.imported.vulnerabilities,

                controls:
                    result.imported.controls,

                insiderThreatEvents:
                    result.imported.insiderThreat,

                createdAssets:
                    result.created.assets,

                errors:
                    result.errors,
            })
        } catch (error) {
            return res.status(400).json({
                valid: false,

                detection: {
                    type: null,
                    confidence: 0,
                    matchedFields: [],
                },

                errors: [
                    getRawFileError(
                        error,
                        'Mixed raw file validation failed.',
                    ),
                ],
            })
        }
    },
)

/* -------------------------------------------------------------------------- */
/* POST /api/import/file/mixed                                                */
/* -------------------------------------------------------------------------- */

importRouter.post(
    '/file/mixed',
    async (req, res) => {
        try {
            const file =
                extractRawFilePayload(req.body)

            if (!file) {
                return res.status(400).json({
                    success: false,

                    message:
                        'A valid filename and file content are required.',

                    errors: [
                        {
                            field: 'file',
                            message:
                                'Expected { filename, content }.',
                        },
                    ],
                })
            }

            const result =
                await importMixedRawFile(file)

            if (!result.success) {
                return res.status(400).json({
                    success: false,

                    message:
                        'Mixed cybersecurity file import failed.',

                    detection:
                        result.detection,

                    imported:
                        result.imported,

                    created:
                        result.created,

                    errors:
                        result.errors,
                })
            }

            return res.status(201).json({
                success: true,

                message:
                    'Mixed cybersecurity data file imported successfully.',

                detection:
                    result.detection,

                imported: {
                    assets:
                        result.imported.assets,

                    vulnerabilities:
                        result.imported.vulnerabilities,

                    controls:
                        result.imported.controls,

                    insiderThreatEvents:
                        result.imported.insiderThreat,

                    total:
                        result.imported.total,
                },

                created: {
                    assets:
                        result.created.assets,
                },

                errors: [],
            })
        } catch (error) {
            return res.status(500).json({
                success: false,

                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to import mixed cybersecurity file.',

                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            })
        }
    },
)

/* -------------------------------------------------------------------------- */
/* POST /api/import/validate                                                  */
/* -------------------------------------------------------------------------- */

importRouter.post(
    '/validate',
    async (req, res) => {
        try {
            const payload =
                extractCompanyPayload(req.body)

            const result =
                await validateCompanyData(payload)

            return res.json({
                valid: result.success,

                totalRows:
                    result.imported.total,

                assets:
                    result.imported.assets,

                vulnerabilities:
                    result.imported.vulnerabilities,

                controls:
                    result.imported.controls,

                insiderThreatEvents:
                    result.imported.insiderThreat,

                createdAssets:
                    result.created.assets,

                errors:
                    result.errors,
            })
        } catch (error) {
            return res.status(500).json({
                valid: false,

                errors: [
                    {
                        field: 'server',

                        message:
                            error instanceof Error
                                ? error.message
                                : 'Company data validation failed.',
                    },
                ],
            })
        }
    },
)

/* -------------------------------------------------------------------------- */
/* POST /api/import                                                           */
/* -------------------------------------------------------------------------- */

importRouter.post(
    '/',
    async (req, res) => {
        try {
            const payload =
                extractCompanyPayload(req.body)

            const result =
                await importCompanyData(payload)

            if (!result.success) {
                return res.status(400).json({
                    success: false,

                    message:
                        'Company data import failed.',

                    imported:
                        result.imported,

                    created:
                        result.created,

                    errors:
                        result.errors,
                })
            }

            return res.status(201).json({
                success: true,

                message:
                    'Company data imported successfully.',

                imported: {
                    assets:
                        result.imported.assets,

                    vulnerabilities:
                        result.imported.vulnerabilities,

                    controls:
                        result.imported.controls,

                    insiderThreatEvents:
                        result.imported.insiderThreat,

                    total:
                        result.imported.total,
                },

                created: {
                    assets:
                        result.created.assets,
                },

                errors: [],
            })
        } catch (error) {
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
        }
    },
)

/* -------------------------------------------------------------------------- */
/* POST /api/import/insider-threat/validate                                   */
/* -------------------------------------------------------------------------- */

importRouter.post(
    '/insider-threat/validate',
    async (req, res) => {
        try {
            const rows =
                extractInsiderThreatPayload(
                    req.body,
                )

            if (rows.length === 0) {
                return res.status(400).json({
                    valid: false,

                    totalRows: 0,

                    insiderThreatEvents: 0,

                    errors: [
                        {
                            field: 'body',

                            message:
                                'Insider threat data must be a non-empty array.',
                        },
                    ],
                })
            }

            const result =
                await validateCompanyData({
                    insiderThreat: rows,
                })

            return res.json({
                valid: result.success,

                totalRows: rows.length,

                insiderThreatEvents:
                    result.imported.insiderThreat,

                errors:
                    result.errors,
            })
        } catch (error) {
            return res.status(500).json({
                valid: false,

                totalRows: 0,

                insiderThreatEvents: 0,

                errors: [
                    {
                        field: 'server',

                        message:
                            error instanceof Error
                                ? error.message
                                : 'Insider threat validation failed.',
                    },
                ],
            })
        }
    },
)

/* -------------------------------------------------------------------------- */
/* POST /api/import/insider-threat                                            */
/* -------------------------------------------------------------------------- */

importRouter.post(
    '/insider-threat',
    async (req, res) => {
        try {
            const rows =
                extractInsiderThreatPayload(
                    req.body,
                )

            if (rows.length === 0) {
                return res.status(400).json({
                    success: false,

                    message:
                        'No insider threat records were provided.',

                    error:
                        'Insider threat data must be a non-empty array.',
                })
            }

            const result =
                await importCompanyData({
                    insiderThreat: rows,
                })

            if (!result.success) {
                return res.status(400).json({
                    success: false,

                    message:
                        'Insider threat data import failed.',

                    imported:
                        result.imported,

                    errors:
                        result.errors,
                })
            }

            return res.status(201).json({
                success: true,

                message:
                    'Insider threat data imported successfully.',

                imported: {
                    insiderThreatEvents:
                        result.imported.insiderThreat,

                    total:
                        result.imported.insiderThreat,
                },

                errors: [],
            })
        } catch (error) {
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
        }
    },
)