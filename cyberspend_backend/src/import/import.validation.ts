import type {
    NormalizedAsset,
    NormalizedControl,
    NormalizedInsiderThreat,
    NormalizedVulnerability,
    RawImportRow,
} from './import.types.js'

export interface ValidationError {
    field: string
    message: string
    row?: number
    value?: unknown
}

export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
}

function isNonEmptyString(
    value: unknown,
): boolean {
    return (
        typeof value === 'string' &&
        value.trim().length > 0
    )
}

function isFiniteNumber(
    value: unknown,
): value is number {
    return (
        typeof value === 'number' &&
        Number.isFinite(value)
    )
}

function isNonNegativeNumber(
    value: unknown,
): boolean {
    return (
        isFiniteNumber(value) &&
        value >= 0
    )
}

function isPercentage(
    value: unknown,
): boolean {
    return (
        isFiniteNumber(value) &&
        value >= 0 &&
        value <= 1
    )
}

function isValidCriticality(
    value: unknown,
): value is
    | 'Low'
    | 'Medium'
    | 'High'
    | 'Critical' {
    return (
        value === 'Low' ||
        value === 'Medium' ||
        value === 'High' ||
        value === 'Critical'
    )
}

function addDuplicateErrors(
    ids: string[],
    entity: string,
    errors: ValidationError[],
): void {
    const seen = new Set<string>()

    for (const id of ids) {
        if (seen.has(id)) {
            errors.push({
                field: `${entity}.id`,
                message:
                    `Duplicate ${entity} ID "${id}".`,
                value: id,
            })
        }

        seen.add(id)
    }
}

export function validateAssets(
    assets: NormalizedAsset[],
): ValidationResult {
    const errors: ValidationError[] = []

    addDuplicateErrors(
        assets.map((asset) => asset.id),
        'assets',
        errors,
    )

    assets.forEach((asset, index) => {
        const row = index + 1

        if (!isNonEmptyString(asset.id)) {
            errors.push({
                field: `assets.${index}.id`,
                message:
                    `Asset row ${row}: ID is required.`,
            })
        }

        if (!isNonEmptyString(asset.name)) {
            errors.push({
                field: `assets.${index}.name`,
                message:
                    `Asset row ${row}: name is required.`,
            })
        }

        if (
            !isNonEmptyString(
                asset.category,
            )
        ) {
            errors.push({
                field: `assets.${index}.category`,
                message:
                    `Asset row ${row}: category is required.`,
            })
        }

        if (
            !isNonNegativeNumber(
                asset.value,
            )
        ) {
            errors.push({
                field: `assets.${index}.value`,
                message:
                    `Asset row ${row}: value must be a non-negative number.`,
                value: asset.value,
            })
        }

        if (
            !isValidCriticality(
                asset.criticality,
            )
        ) {
            errors.push({
                field: `assets.${index}.criticality`,
                message:
                    `Asset row ${row}: invalid criticality.`,
                value: asset.criticality,
            })
        }

        if (
            typeof asset.internetExposed !==
            'boolean'
        ) {
            errors.push({
                field:
                    `assets.${index}.internetExposed`,
                message:
                    `Asset row ${row}: internet exposure must be boolean.`,
                value:
                    asset.internetExposed,
            })
        }
    })

    return {
        valid: errors.length === 0,
        errors,
    }
}

export function validateVulnerabilities(
    vulnerabilities: NormalizedVulnerability[],
): ValidationResult {
    const errors: ValidationError[] = []

    addDuplicateErrors(
        vulnerabilities.map(
            (vulnerability) =>
                vulnerability.id,
        ),
        'vulnerabilities',
        errors,
    )

    vulnerabilities.forEach(
        (vulnerability, index) => {
            const row = index + 1

            if (
                !isNonEmptyString(
                    vulnerability.id,
                )
            ) {
                errors.push({
                    field:
                        `vulnerabilities.${index}.id`,
                    message:
                        `Vulnerability row ${row}: ID is required.`,
                })
            }

            if (
                !isNonEmptyString(
                    vulnerability.name,
                )
            ) {
                errors.push({
                    field:
                        `vulnerabilities.${index}.name`,
                    message:
                        `Vulnerability row ${row}: name is required.`,
                })
            }

            if (
                !isNonEmptyString(
                    vulnerability.assetId,
                )
            ) {
                errors.push({
                    field:
                        `vulnerabilities.${index}.assetId`,
                    message:
                        `Vulnerability row ${row}: asset reference could not be resolved.`,
                })
            }

            if (
                !isFiniteNumber(
                    vulnerability.cvss,
                ) ||
                vulnerability.cvss < 0 ||
                vulnerability.cvss > 10
            ) {
                errors.push({
                    field:
                        `vulnerabilities.${index}.cvss`,
                    message:
                        `Vulnerability row ${row}: CVSS must be between 0 and 10.`,
                    value:
                        vulnerability.cvss,
                })
            }

            if (
                typeof vulnerability.exploitAvailable !==
                'boolean'
            ) {
                errors.push({
                    field:
                        `vulnerabilities.${index}.exploitAvailable`,
                    message:
                        `Vulnerability row ${row}: exploit availability must be boolean.`,
                })
            }

            if (
                !isPercentage(
                    vulnerability.controlEffectiveness,
                )
            ) {
                errors.push({
                    field:
                        `vulnerabilities.${index}.controlEffectiveness`,
                    message:
                        `Vulnerability row ${row}: control effectiveness must be between 0 and 1.`,
                    value:
                        vulnerability.controlEffectiveness,
                })
            }

            if (
                !(
                    vulnerability.discoveredOn instanceof
                    Date
                ) ||
                Number.isNaN(
                    vulnerability.discoveredOn.getTime(),
                )
            ) {
                errors.push({
                    field:
                        `vulnerabilities.${index}.discoveredOn`,
                    message:
                        `Vulnerability row ${row}: discovery date is invalid.`,
                })
            }
        },
    )

    return {
        valid: errors.length === 0,
        errors,
    }
}

export function validateControls(
    controls: NormalizedControl[],
): ValidationResult {
    const errors: ValidationError[] = []

    addDuplicateErrors(
        controls.map(
            (control) => control.id,
        ),
        'controls',
        errors,
    )

    controls.forEach((control, index) => {
        const row = index + 1

        if (!isNonEmptyString(control.id)) {
            errors.push({
                field: `controls.${index}.id`,
                message:
                    `Control row ${row}: ID is required.`,
            })
        }

        if (
            !isNonEmptyString(
                control.name,
            )
        ) {
            errors.push({
                field: `controls.${index}.name`,
                message:
                    `Control row ${row}: name is required.`,
            })
        }

        if (
            !isNonEmptyString(
                control.category,
            )
        ) {
            errors.push({
                field:
                    `controls.${index}.category`,
                message:
                    `Control row ${row}: category is required.`,
            })
        }

        if (
            !isNonNegativeNumber(
                control.cost,
            )
        ) {
            errors.push({
                field:
                    `controls.${index}.cost`,
                message:
                    `Control row ${row}: cost must be a non-negative number.`,
                value: control.cost,
            })
        }

        if (
            !isPercentage(
                control.riskReductionPct,
            )
        ) {
            errors.push({
                field:
                    `controls.${index}.riskReductionPct`,
                message:
                    `Control row ${row}: risk reduction must be between 0 and 1.`,
                value:
                    control.riskReductionPct,
            })
        }
    })

    return {
        valid: errors.length === 0,
        errors,
    }
}

export function validateInsiderThreats(
    events: NormalizedInsiderThreat[],
): ValidationResult {
    const errors: ValidationError[] = []

    addDuplicateErrors(
        events.map(
            (event) => event.id,
        ),
        'insiderThreat',
        errors,
    )

    events.forEach((event, index) => {
        const row = index + 1

        if (!isNonEmptyString(event.id)) {
            errors.push({
                field:
                    `insiderThreat.${index}.id`,
                message:
                    `Insider threat row ${row}: ID is required.`,
            })
        }

        if (
            !isNonEmptyString(
                event.employeeDepartment,
            )
        ) {
            errors.push({
                field:
                    `insiderThreat.${index}.employeeDepartment`,
                message:
                    `Insider threat row ${row}: employee department is required.`,
            })
        }

        if (
            !isNonEmptyString(
                event.employeeCampus,
            )
        ) {
            errors.push({
                field:
                    `insiderThreat.${index}.employeeCampus`,
                message:
                    `Insider threat row ${row}: employee campus is required.`,
            })
        }

        if (
            !isNonEmptyString(
                event.employeePosition,
            )
        ) {
            errors.push({
                field:
                    `insiderThreat.${index}.employeePosition`,
                message:
                    `Insider threat row ${row}: employee position is required.`,
            })
        }

        if (
            !isNonNegativeNumber(
                event.employeeSeniorityYears,
            )
        ) {
            errors.push({
                field:
                    `insiderThreat.${index}.employeeSeniorityYears`,
                message:
                    `Insider threat row ${row}: seniority years must be non-negative.`,
                value:
                    event.employeeSeniorityYears,
            })
        }

        const binaryFields: Array<
            [
                keyof NormalizedInsiderThreat,
                string,
            ]
        > = [
                [
                    'isContractor',
                    'isContractor',
                ],
                [
                    'hasForeignCitizenship',
                    'hasForeignCitizenship',
                ],
                [
                    'hasCriminalRecord',
                    'hasCriminalRecord',
                ],
                [
                    'hasMedicalHistory',
                    'hasMedicalHistory',
                ],
                [
                    'burnedFromOther',
                    'burnedFromOther',
                ],
                [
                    'isAbroad',
                    'isAbroad',
                ],
                [
                    'lateExitFlag',
                    'lateExitFlag',
                ],
                [
                    'entryDuringWeekend',
                    'entryDuringWeekend',
                ],
            ]

        for (
            const [field, label] of
            binaryFields
        ) {
            const value = event[field]

            if (
                value !== 0 &&
                value !== 1
            ) {
                errors.push({
                    field:
                        `insiderThreat.${index}.${String(field)}`,
                    message:
                        `Insider threat row ${row}: ${label} must be 0 or 1.`,
                    value,
                })
            }
        }

        const integerFields: Array<
            [
                keyof NormalizedInsiderThreat,
                string,
            ]
        > = [
                [
                    'employeeClassification',
                    'employee classification',
                ],
                [
                    'hostilityCountryLevel',
                    'hostility country level',
                ],
                [
                    'numEntries',
                    'number of entries',
                ],
                [
                    'numUniqueCampus',
                    'unique campus count',
                ],
                [
                    'totalPrintedPages',
                    'total printed pages',
                ],
                [
                    'numPrintedPagesOffHours',
                    'off-hours printed pages',
                ],
                [
                    'totalFilesBurned',
                    'total files burned',
                ],
            ]

        for (
            const [field, label] of
            integerFields
        ) {
            const value = event[field]

            if (
                !Number.isInteger(value) ||
                Number(value) < 0
            ) {
                errors.push({
                    field:
                        `insiderThreat.${index}.${String(field)}`,
                    message:
                        `Insider threat row ${row}: ${label} must be a non-negative integer.`,
                    value,
                })
            }
        }

        if (
            event.tripDayNumber !== null &&
            !isNonNegativeNumber(
                event.tripDayNumber,
            )
        ) {
            errors.push({
                field:
                    `insiderThreat.${index}.tripDayNumber`,
                message:
                    `Insider threat row ${row}: trip day number must be non-negative.`,
                value:
                    event.tripDayNumber,
            })
        }

        if (
            !isNonEmptyString(
                event.employeeOriginCountry,
            )
        ) {
            errors.push({
                field:
                    `insiderThreat.${index}.employeeOriginCountry`,
                message:
                    `Insider threat row ${row}: employee origin country is required.`,
            })
        }

        if (
            typeof event.isMalicious !==
            'boolean'
        ) {
            errors.push({
                field:
                    `insiderThreat.${index}.isMalicious`,
                message:
                    `Insider threat row ${row}: malicious flag must be boolean.`,
                value:
                    event.isMalicious,
            })
        }
    })

    return {
        valid: errors.length === 0,
        errors,
    }
}

export function validateGenericRows(
    rows: RawImportRow[],
): ValidationResult {
    const errors: ValidationError[] = []

    if (!Array.isArray(rows)) {
        return {
            valid: false,
            errors: [
                {
                    field: 'generic',
                    message:
                        'Generic dataset must be an array.',
                },
            ],
        }
    }

    if (rows.length === 0) {
        return {
            valid: false,
            errors: [
                {
                    field: 'generic',
                    message:
                        'Generic dataset contains no records.',
                },
            ],
        }
    }

    rows.forEach((row, index) => {
        if (
            !row ||
            typeof row !== 'object' ||
            Array.isArray(row)
        ) {
            errors.push({
                field:
                    `generic.${index}`,
                message:
                    `Generic row ${index + 1} must be a valid object.`,
                row: index + 1,
                value: row,
            })
        }
    })

    return {
        valid: errors.length === 0,
        errors,
    }
}

export function validateImportData(
    data: {
        assets: NormalizedAsset[]
        vulnerabilities: NormalizedVulnerability[]
        controls: NormalizedControl[]
        insiderThreat: NormalizedInsiderThreat[]
        generic?: RawImportRow[]
    },
): ValidationResult {
    const errors: ValidationError[] = []

    const assetResult =
        validateAssets(data.assets)

    const vulnerabilityResult =
        validateVulnerabilities(
            data.vulnerabilities,
        )

    const controlResult =
        validateControls(
            data.controls,
        )

    const insiderThreatResult =
        validateInsiderThreats(
            data.insiderThreat,
        )

    errors.push(
        ...assetResult.errors,
        ...vulnerabilityResult.errors,
        ...controlResult.errors,
        ...insiderThreatResult.errors,
    )

    if (data.generic) {
        const genericResult =
            validateGenericRows(
                data.generic,
            )

        errors.push(
            ...genericResult.errors,
        )
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

export function validateRawRows(
    rows: RawImportRow[],
): ValidationResult {
    return validateGenericRows(rows)
}

export function limitValidationErrors(
    errors: ValidationError[],
    limit = 50,
): ValidationError[] {
    return errors.slice(0, limit)
}