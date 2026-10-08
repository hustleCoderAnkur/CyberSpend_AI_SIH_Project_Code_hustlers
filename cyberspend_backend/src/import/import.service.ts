import { db } from '../db/index.js'

import {
    assets,
    controls,
    insiderThreatEvents,
    vulnerabilities,
} from '../db/schema.js'

import type {
    DatasetDetectionResult,
    DatasetType,
    ImportServiceInput,
    NormalizedAsset,
    NormalizedControl,
    NormalizedInsiderThreat,
    NormalizedVulnerability,
    RawImportRow,
} from './import.types.js'

import {
    detectDatasetType,
} from './import.detector.js'

import {
    mapRowsToDataset,
    splitMixedRows,
} from './import.mapper.js'

import {
    parseImportFile,
} from './import.parser.js'

import {
    normalizeAssets,
    normalizeControls,
    normalizeInsiderThreats,
    normalizeVulnerabilities,
} from './import.normalizer.js'

import {
    validateAssets,
    validateControls,
    validateInsiderThreats,
    validateVulnerabilities,
} from './import.validation.js'

import {
    resolveVulnerabilityAssets,
} from './import.resolver.js'

export interface ImportServiceResult {
    success: boolean

    imported: {
        assets: number
        vulnerabilities: number
        controls: number
        insiderThreat: number
        total: number
    }

    created: {
        assets: number
    }

    errors: Array<{
        field: string
        message: string
        row?: number
        value?: unknown
    }>
}

export interface RawFileImportInput {
    filename: string
    content: string
}

export interface RawFileValidationResult
    extends ImportServiceResult {
    detection: DatasetDetectionResult
}

interface PreparedImportData {
    assets: NormalizedAsset[]
    vulnerabilities: NormalizedVulnerability[]
    controls: NormalizedControl[]
    insiderThreat: NormalizedInsiderThreat[]
    createdAssets: number
}

function uniqueById<T extends { id: string }>(
    rows: T[],
): T[] {
    const map = new Map<string, T>()

    for (const row of rows) {
        map.set(row.id, row)
    }

    return Array.from(map.values())
}

function normalizeInput(
    input: ImportServiceInput,
) {
    const insiderRows =
        input.insiderThreat?.length
            ? input.insiderThreat
            : input.insiderThreatEvents ?? []

    return {
        assets: normalizeAssets(
            input.assets ?? [],
        ),

        vulnerabilities:
            normalizeVulnerabilities(
                input.vulnerabilities ?? [],
            ),

        controls: normalizeControls(
            input.controls ?? [],
        ),

        insiderThreat:
            normalizeInsiderThreats(
                insiderRows,
            ),
    }
}

async function getExistingAssets(): Promise<NormalizedAsset[]> {
    const rows = await db
        .select({
            id: assets.id,
            name: assets.name,
            category: assets.category,
            value: assets.value,
            criticality: assets.criticality,
            internetExposed:
                assets.internetExposed,
        })
        .from(assets)

    return rows.map((asset) => ({
        id: asset.id,
        name: asset.name,
        category: asset.category,
        value: asset.value,
        criticality: asset.criticality,
        internetExposed:
            asset.internetExposed,
    }))
}

async function prepareImportData(
    input: ImportServiceInput,
): Promise<{
    prepared: PreparedImportData | null
    errors: ImportServiceResult['errors']
}> {
    const normalized = normalizeInput(input)

    normalized.assets = uniqueById(
        normalized.assets,
    )

    normalized.vulnerabilities =
        uniqueById(
            normalized.vulnerabilities,
        )

    normalized.controls = uniqueById(
        normalized.controls,
    )

    normalized.insiderThreat =
        uniqueById(
            normalized.insiderThreat,
        )

    const errors: ImportServiceResult['errors'] = []

    const assetValidation =
        validateAssets(
            normalized.assets,
        )

    const vulnerabilityValidation =
        validateVulnerabilities(
            normalized.vulnerabilities,
        )

    const controlValidation =
        validateControls(
            normalized.controls,
        )

    const insiderValidation =
        validateInsiderThreats(
            normalized.insiderThreat,
        )

    errors.push(
        ...assetValidation.errors,
        ...vulnerabilityValidation.errors,
        ...controlValidation.errors,
        ...insiderValidation.errors,
    )

    if (errors.length > 0) {
        return {
            prepared: null,
            errors,
        }
    }

    let assetsForResolution =
        normalized.assets

    /*
     * Vulnerabilities can reference:
     *
     * 1. Assets from the same upload
     * 2. Assets already present in the database
     *
     * Uploaded assets take priority over existing assets.
     */
    if (
        normalized.vulnerabilities.length > 0
    ) {
        const existingAssets =
            await getExistingAssets()

        const assetMap =
            new Map<string, NormalizedAsset>()

        for (const asset of existingAssets) {
            assetMap.set(
                asset.id.toLowerCase(),
                asset,
            )

            assetMap.set(
                asset.name.toLowerCase(),
                asset,
            )
        }

        for (
            const asset of normalized.assets
        ) {
            assetMap.set(
                asset.id.toLowerCase(),
                asset,
            )

            assetMap.set(
                asset.name.toLowerCase(),
                asset,
            )
        }

        const mergedAssets =
            new Map<string, NormalizedAsset>()

        for (const asset of existingAssets) {
            mergedAssets.set(
                asset.id,
                asset,
            )
        }

        for (const asset of normalized.assets) {
            mergedAssets.set(
                asset.id,
                asset,
            )
        }

        assetsForResolution =
            Array.from(
                mergedAssets.values(),
            )
    }

    const resolved =
        resolveVulnerabilityAssets(
            assetsForResolution,
            normalized.vulnerabilities,
        )

    if (
        resolved.unresolvedVulnerabilities
            .length > 0
    ) {
        for (
            const unresolved of
            resolved.unresolvedVulnerabilities
        ) {
            errors.push({
                field:
                    `vulnerabilities.${unresolved.vulnerabilityId}.assetId`,

                message:
                    `Unable to resolve asset "${unresolved.assetReference}".`,

                value:
                    unresolved.assetReference,
            })
        }

        return {
            prepared: null,
            errors,
        }
    }

    /*
     * Return only:
     *
     * - uploaded assets
     * - auto-created assets
     *
     * Existing DB assets should not be counted
     * as newly imported assets.
     */
    const uploadedAssetIds =
        new Set(
            normalized.assets.map(
                (asset) => asset.id,
            ),
        )

    const assetsToReturn =
        resolved.assets.filter(
            (asset) =>
                uploadedAssetIds.has(
                    asset.id,
                ) ||
                asset.id.startsWith(
                    'AST-AUTO-',
                ),
        )

    return {
        prepared: {
            assets:
                assetsToReturn,

            vulnerabilities:
                resolved.vulnerabilities,

            controls:
                normalized.controls,

            insiderThreat:
                normalized.insiderThreat,

            createdAssets:
                resolved.createdAssets,
        },

        errors: [],
    }
}

function createResult(
    prepared: PreparedImportData,
): ImportServiceResult {
    const imported = {
        assets:
            prepared.assets.length,

        vulnerabilities:
            prepared.vulnerabilities.length,

        controls:
            prepared.controls.length,

        insiderThreat:
            prepared.insiderThreat.length,

        total:
            prepared.assets.length +
            prepared.vulnerabilities.length +
            prepared.controls.length +
            prepared.insiderThreat.length,
    }

    return {
        success: true,

        imported,

        created: {
            assets:
                prepared.createdAssets,
        },

        errors: [],
    }
}

function emptyResult(
    errors: ImportServiceResult['errors'],
): ImportServiceResult {
    return {
        success: false,

        imported: {
            assets: 0,
            vulnerabilities: 0,
            controls: 0,
            insiderThreat: 0,
            total: 0,
        },

        created: {
            assets: 0,
        },

        errors,
    }
}

export async function validateCompanyData(
    input: ImportServiceInput,
): Promise<ImportServiceResult> {
    const {
        prepared,
        errors,
    } = await prepareImportData(input)

    if (!prepared) {
        return emptyResult(errors)
    }

    return createResult(prepared)
}

export async function importCompanyData(
    input: ImportServiceInput,
): Promise<ImportServiceResult> {
    const {
        prepared,
        errors,
    } = await prepareImportData(input)

    if (!prepared) {
        return emptyResult(errors)
    }

    await db.transaction(async (tx) => {
        if (prepared.assets.length > 0) {
            await tx
                .insert(assets)
                .values(prepared.assets)
                .onConflictDoUpdate({
                    target: assets.id,

                    set: {
                        name: assets.name,
                        category:
                            assets.category,
                        value: assets.value,
                        criticality:
                            assets.criticality,
                        internetExposed:
                            assets.internetExposed,
                    },
                })
        }

        if (
            prepared.vulnerabilities.length >
            0
        ) {
            await tx
                .insert(vulnerabilities)
                .values(
                    prepared.vulnerabilities,
                )
                .onConflictDoUpdate({
                    target:
                        vulnerabilities.id,

                    set: {
                        assetId:
                            vulnerabilities.assetId,

                        name:
                            vulnerabilities.name,

                        cvss:
                            vulnerabilities.cvss,

                        exploitAvailable:
                            vulnerabilities.exploitAvailable,

                        controlEffectiveness:
                            vulnerabilities.controlEffectiveness,

                        discoveredOn:
                            vulnerabilities.discoveredOn,
                    },
                })
        }

        if (prepared.controls.length > 0) {
            await tx
                .insert(controls)
                .values(
                    prepared.controls,
                )
                .onConflictDoUpdate({
                    target: controls.id,

                    set: {
                        name:
                            controls.name,

                        category:
                            controls.category,

                        cost:
                            controls.cost,

                        riskReductionPct:
                            controls.riskReductionPct,
                    },
                })
        }

        if (
            prepared.insiderThreat.length >
            0
        ) {
            await tx
                .insert(insiderThreatEvents)
                .values(
                    prepared.insiderThreat,
                )
                .onConflictDoUpdate({
                    target:
                        insiderThreatEvents.id,

                    set: {
                        employeeDepartment:
                            insiderThreatEvents.employeeDepartment,

                        employeeCampus:
                            insiderThreatEvents.employeeCampus,

                        employeePosition:
                            insiderThreatEvents.employeePosition,

                        employeeSeniorityYears:
                            insiderThreatEvents.employeeSeniorityYears,

                        isContractor:
                            insiderThreatEvents.isContractor,

                        employeeClassification:
                            insiderThreatEvents.employeeClassification,

                        hasForeignCitizenship:
                            insiderThreatEvents.hasForeignCitizenship,

                        hasCriminalRecord:
                            insiderThreatEvents.hasCriminalRecord,

                        hasMedicalHistory:
                            insiderThreatEvents.hasMedicalHistory,

                        employeeOriginCountry:
                            insiderThreatEvents.employeeOriginCountry,

                        totalPrintedPages:
                            insiderThreatEvents.totalPrintedPages,

                        numPrintedPagesOffHours:
                            insiderThreatEvents.numPrintedPagesOffHours,

                        totalFilesBurned:
                            insiderThreatEvents.totalFilesBurned,

                        burnedFromOther:
                            insiderThreatEvents.burnedFromOther,

                        isAbroad:
                            insiderThreatEvents.isAbroad,

                        tripDayNumber:
                            insiderThreatEvents.tripDayNumber,

                        hostilityCountryLevel:
                            insiderThreatEvents.hostilityCountryLevel,

                        numEntries:
                            insiderThreatEvents.numEntries,

                        numUniqueCampus:
                            insiderThreatEvents.numUniqueCampus,

                        lateExitFlag:
                            insiderThreatEvents.lateExitFlag,

                        entryDuringWeekend:
                            insiderThreatEvents.entryDuringWeekend,

                        isMalicious:
                            insiderThreatEvents.isMalicious,
                    },
                })
        }
    })

    return createResult(prepared)
}

function rowsToImportInput(
    rows: RawImportRow[],
    type: DatasetType,
): ImportServiceInput {
    const mappedRows =
        mapRowsToDataset(
            rows,
            type,
        )

    switch (type) {
        case 'assets':
            return {
                assets: mappedRows,
            }

        case 'vulnerabilities':
            return {
                vulnerabilities:
                    mappedRows,
            }

        case 'controls':
            return {
                controls: mappedRows,
            }

        case 'insiderThreat':
            return {
                insiderThreat:
                    mappedRows,
            }
    }
}

function buildMixedImportInput(
    rows: RawImportRow[],
): ImportServiceInput {
    const split =
        splitMixedRows(rows)

    return {
        assets:
            split.assets,

        vulnerabilities:
            split.vulnerabilities,

        controls:
            split.controls,

        insiderThreat:
            split.insiderThreat,
    }
}

export async function validateRawFile(
    input: RawFileImportInput,
): Promise<RawFileValidationResult> {
    const parsed =
        parseImportFile(
            input.filename,
            input.content,
        )

    if (
        !parsed.success ||
        !parsed.data
    ) {
        return {
            ...emptyResult(
                parsed.errors,
            ),

            detection: {
                type: null,
                confidence: 0,
                matchedFields: [],
            },
        }
    }

    const rows =
        parsed.data.rows

    const detection =
        detectDatasetType(rows)

    if (!detection.type) {
        return {
            ...emptyResult([
                {
                    field: 'dataset',

                    message:
                        'Unable to determine the cybersecurity dataset type from the uploaded file.',
                },
            ]),

            detection,
        }
    }

    const payload =
        rowsToImportInput(
            rows,
            detection.type,
        )

    const result =
        await validateCompanyData(
            payload,
        )

    return {
        ...result,
        detection,
    }
}

export async function importRawFile(
    input: RawFileImportInput,
): Promise<RawFileValidationResult> {
    const parsed =
        parseImportFile(
            input.filename,
            input.content,
        )

    if (
        !parsed.success ||
        !parsed.data
    ) {
        return {
            ...emptyResult(
                parsed.errors,
            ),

            detection: {
                type: null,
                confidence: 0,
                matchedFields: [],
            },
        }
    }

    const rows =
        parsed.data.rows

    const detection =
        detectDatasetType(rows)

    if (!detection.type) {
        return {
            ...emptyResult([
                {
                    field: 'dataset',

                    message:
                        'Unable to determine the cybersecurity dataset type from the uploaded file.',
                },
            ]),

            detection,
        }
    }

    const payload =
        rowsToImportInput(
            rows,
            detection.type,
        )

    const result =
        await importCompanyData(
            payload,
        )

    return {
        ...result,
        detection,
    }
}

export async function validateMixedRawFile(
    input: RawFileImportInput,
): Promise<RawFileValidationResult> {
    const parsed =
        parseImportFile(
            input.filename,
            input.content,
        )

    if (
        !parsed.success ||
        !parsed.data
    ) {
        return {
            ...emptyResult(
                parsed.errors,
            ),

            detection: {
                type: null,
                confidence: 0,
                matchedFields: [],
            },
        }
    }

    const rows =
        parsed.data.rows

    /*
     * Detection is only informational for mixed files.
     *
     * It MUST NOT decide which dataset receives
     * the complete file.
     */
    const detection =
        detectDatasetType(rows)

    const payload =
        buildMixedImportInput(rows)

    const result =
        await validateCompanyData(
            payload,
        )

    return {
        ...result,
        detection,
    }
}

export async function importMixedRawFile(
    input: RawFileImportInput,
): Promise<RawFileValidationResult> {
    const parsed =
        parseImportFile(
            input.filename,
            input.content,
        )

    if (
        !parsed.success ||
        !parsed.data
    ) {
        return {
            ...emptyResult(
                parsed.errors,
            ),

            detection: {
                type: null,
                confidence: 0,
                matchedFields: [],
            },
        }
    }

    const rows =
        parsed.data.rows

    /*
     * Detection is informational only.
     *
     * Actual dataset separation happens through
     * splitMixedRows().
     */
    const detection =
        detectDatasetType(rows)

    const payload =
        buildMixedImportInput(rows)

    const result =
        await importCompanyData(
            payload,
        )

    return {
        ...result,
        detection,
    }
}