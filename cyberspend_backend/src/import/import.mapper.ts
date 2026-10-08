import type {
    DatasetType,
    RawImportRow,
} from './import.types.js'

const DATASET_TYPES: DatasetType[] = [
    'assets',
    'vulnerabilities',
    'controls',
    'insiderThreat',
    'generic',
]

type AliasMap = Record<string, string[]>

const FIELD_ALIASES: Record<
    Exclude<DatasetType, 'generic'>,
    AliasMap
> = {
    assets: {
        id: [
            'id',
            'asset_id',
            'asset id',
            'assetid',
            'asset_identifier',
            'asset identifier',
            'resource_id',
            'resource id',
        ],
        name: [
            'name',
            'asset',
            'asset_name',
            'asset name',
            'assetname',
            'hostname',
            'host_name',
            'host name',
            'server',
            'device',
            'system',
            'resource',
            'resource_name',
            'resource name',
        ],
        category: [
            'category',
            'asset_category',
            'asset category',
            'asset_type',
            'asset type',
            'type',
            'class',
        ],
        value: [
            'value',
            'asset_value',
            'asset value',
            'assetvalue',
            'financial_value',
            'financial value',
            'business_value',
            'business value',
        ],
        criticality: [
            'criticality',
            'critical',
            'criticality_level',
            'criticality level',
            'severity',
            'priority',
        ],
        internetExposed: [
            'internet_exposed',
            'internet exposed',
            'internetexposed',
            'internet_exposure',
            'internet exposure',
            'internet_accessible',
            'internet accessible',
            'publicly_exposed',
            'publicly exposed',
            'external',
            'internet_facing',
            'internet facing',
        ],
    },

    vulnerabilities: {
        id: [
            'vulnerability_id',
            'vulnerability id',
            'vulnerabilityid',
            'vuln_id',
            'vuln id',
            'cve',
            'cve_id',
            'cve id',
            'finding_id',
            'finding id',
        ],
        assetId: [
            'asset_id',
            'asset id',
            'assetid',
            'asset_name',
            'asset name',
            'assetname',
            'affected_asset',
            'affected asset',
            'affected_asset_name',
            'affected asset name',
            'hostname',
            'host_name',
            'host name',
            'server',
            'device',
            'system',
        ],
        name: [
            'vulnerability',
            'vulnerability_name',
            'vulnerability name',
            'vulnerabilityname',
            'vuln',
            'vuln_name',
            'vuln name',
            'name',
            'title',
            'finding',
            'finding_name',
            'finding name',
            'issue',
            'issue_name',
            'issue name',
            'weakness',
        ],
        cvss: [
            'cvss',
            'cvss_score',
            'cvss score',
            'cvssscore',
            'cvss_v2',
            'cvss v2',
            'cvss_v3',
            'cvss v3',
            'cvss_score_v3',
            'cvss score v3',
        ],
        exploitAvailable: [
            'exploit',
            'exploit_available',
            'exploit available',
            'exploitavailable',
            'exploitability',
            'has_exploit',
            'has exploit',
            'public_exploit',
            'public exploit',
        ],
        controlEffectiveness: [
            'control_effectiveness',
            'control effectiveness',
            'controleffectiveness',
            'effectiveness',
            'control_score',
            'control score',
        ],
        discoveredOn: [
            'discovered_on',
            'discovered on',
            'discovery_date',
            'discovery date',
            'discovered_date',
            'discovered date',
            'date_discovered',
            'date discovered',
            'discovered',
        ],
    },

    controls: {
        id: [
            'control_id',
            'control id',
            'controlid',
            'security_control_id',
            'security control id',
            'securitycontrolid',
            'id',
        ],
        name: [
            'control',
            'control_name',
            'control name',
            'controlname',
            'security_control',
            'security control',
            'security_control_name',
            'security control name',
            'securitycontrolname',
            'safeguard',
            'safeguard_name',
            'safeguard name',
            'countermeasure',
            'mitigation',
            'name',
        ],
        category: [
            'control_category',
            'control category',
            'controlcategory',
            'security_control_category',
            'security control category',
            'securitycategory',
            'category',
            'control_type',
            'control type',
            'type',
        ],
        cost: [
            'cost',
            'control_cost',
            'control cost',
            'controlcost',
            'implementation_cost',
            'implementation cost',
            'implementationcost',
            'annual_cost',
            'annual cost',
            'investment',
            'price',
        ],
        riskReductionPct: [
            'risk_reduction',
            'risk reduction',
            'riskreduction',
            'risk_reduction_pct',
            'risk reduction pct',
            'riskreductionpct',
            'risk_reduction_percent',
            'risk reduction percent',
            'riskreductionpercent',
            'reduction',
            'reduction_pct',
            'reduction pct',
            'effectiveness',
            'effectiveness_pct',
            'effectiveness percent',
        ],
    },

    insiderThreat: {
        id: [
            'id',
            'event_id',
            'event id',
            'eventid',
            'employee_id',
            'employee id',
            'employeeid',
        ],
        employeeDepartment: [
            'employee_department',
            'employee department',
            'department',
            'dept',
        ],
        employeeCampus: [
            'employee_campus',
            'employee campus',
            'campus',
            'location',
            'office',
        ],
        employeePosition: [
            'employee_position',
            'employee position',
            'position',
            'job_title',
            'job title',
            'role',
        ],
        employeeSeniorityYears: [
            'employee_seniority_years',
            'employee seniority years',
            'seniority_years',
            'seniority years',
            'seniority',
            'years_at_company',
            'years at company',
        ],
        isContractor: [
            'is_contractor',
            'is contractor',
            'contractor',
            'contract',
        ],
        employeeClassification: [
            'employee_classification',
            'employee classification',
            'classification',
            'employee_type',
            'employee type',
        ],
        hasForeignCitizenship: [
            'has_foreign_citizenship',
            'has foreign citizenship',
            'foreign_citizenship',
            'foreign citizenship',
            'foreign',
        ],
        hasCriminalRecord: [
            'has_criminal_record',
            'has criminal record',
            'criminal_record',
            'criminal record',
        ],
        hasMedicalHistory: [
            'has_medical_history',
            'has medical history',
            'medical_history',
            'medical history',
        ],
        employeeOriginCountry: [
            'employee_origin_country',
            'employee origin country',
            'origin_country',
            'origin country',
            'country',
        ],
        totalPrintedPages: [
            'total_printed_pages',
            'total printed pages',
            'printed_pages',
            'printed pages',
        ],
        numPrintedPagesOffHours: [
            'num_printed_pages_off_hours',
            'num printed pages off hours',
            'off_hours_pages',
            'off hours pages',
            'printed_pages_off_hours',
            'printed pages off hours',
        ],
        totalFilesBurned: [
            'total_files_burned',
            'total files burned',
            'files_burned',
            'files burned',
        ],
        burnedFromOther: [
            'burned_from_other',
            'burned from other',
            'files_burned_from_other',
            'files burned from other',
        ],
        isAbroad: [
            'is_abroad',
            'is abroad',
            'abroad',
        ],
        tripDayNumber: [
            'trip_day_number',
            'trip day number',
            'trip_day',
            'trip day',
            'day_of_trip',
            'day of trip',
        ],
        hostilityCountryLevel: [
            'hostility_country_level',
            'hostility country level',
            'hostility_level',
            'hostility level',
            'country_hostility_level',
            'country hostility level',
        ],
        numEntries: [
            'num_entries',
            'num entries',
            'entries',
            'entry_count',
            'entry count',
        ],
        numUniqueCampus: [
            'num_unique_campus',
            'num unique campus',
            'unique_campus',
            'unique campus',
            'unique_campuses',
        ],
        lateExitFlag: [
            'late_exit_flag',
            'late exit flag',
            'late_exit',
            'late exit',
        ],
        entryDuringWeekend: [
            'entry_during_weekend',
            'entry during weekend',
            'weekend_entry',
            'weekend entry',
        ],
        isMalicious: [
            'is_malicious',
            'is malicious',
            'malicious',
        ],
    },
}

function normalizeKey(value: unknown): string {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[\s\-./]+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
}

function hasValue(value: unknown): boolean {
    return (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
    )
}

function getAliasMap(
    type: Exclude<DatasetType, 'generic'>,
): Map<string, string> {
    const map = new Map<string, string>()

    for (const [canonical, aliases] of Object.entries(
        FIELD_ALIASES[type],
    )) {
        for (const alias of aliases) {
            map.set(normalizeKey(alias), canonical)
        }
    }

    return map
}

function findCanonicalField(
    key: string,
    type: Exclude<DatasetType, 'generic'>,
): string | null {
    const normalizedKey = normalizeKey(key)

    if (!normalizedKey) {
        return null
    }

    const aliasMap = getAliasMap(type)

    const exact = aliasMap.get(normalizedKey)

    if (exact) {
        return exact
    }

    for (const [alias, canonical] of aliasMap.entries()) {
        if (
            normalizedKey === alias ||
            normalizedKey.startsWith(`${alias}_`) ||
            normalizedKey.endsWith(`_${alias}`)
        ) {
            return canonical
        }
    }

    return null
}

function mapRow(
    row: RawImportRow,
    type: Exclude<DatasetType, 'generic'>,
): RawImportRow {
    const mapped: RawImportRow = {}

    for (const [key, value] of Object.entries(row)) {
        const canonical = findCanonicalField(key, type)

        if (!canonical) {
            continue
        }

        if (!hasValue(value)) {
            continue
        }

        if (!hasValue(mapped[canonical])) {
            mapped[canonical] = value
        }
    }

    return mapped
}

function countMeaningfulFields(
    row: RawImportRow,
): number {
    return Object.values(row).filter(hasValue).length
}

function isMeaningfulDatasetRow(
    row: RawImportRow,
    type: Exclude<DatasetType, 'generic'>,
): boolean {
    if (countMeaningfulFields(row) === 0) {
        return false
    }

    switch (type) {
        case 'assets':
            return (
                hasValue(row.name) ||
                hasValue(row.value) ||
                hasValue(row.category) ||
                hasValue(row.criticality) ||
                hasValue(row.internetExposed)
            )

        case 'vulnerabilities':
            return (
                hasValue(row.name) &&
                (
                    hasValue(row.assetId) ||
                    hasValue(row.cvss) ||
                    hasValue(row.exploitAvailable) ||
                    hasValue(row.discoveredOn)
                )
            )

        case 'controls':
            return (
                hasValue(row.name) &&
                (
                    hasValue(row.category) ||
                    hasValue(row.cost) ||
                    hasValue(row.riskReductionPct)
                )
            )

        case 'insiderThreat':
            return (
                hasValue(row.employeeDepartment) ||
                hasValue(row.employeeCampus) ||
                hasValue(row.employeePosition) ||
                hasValue(row.employeeSeniorityYears) ||
                hasValue(row.isContractor) ||
                hasValue(row.isMalicious)
            )

        default:
            return false
    }
}

function hasAssetIdentity(
    row: RawImportRow,
): boolean {
    return (
        hasValue(row.value) ||
        hasValue(row.category) ||
        hasValue(row.criticality) ||
        hasValue(row.internetExposed)
    )
}

function hasVulnerabilityIdentity(
    row: RawImportRow,
): boolean {
    return (
        hasValue(row.cvss) ||
        hasValue(row.exploitAvailable) ||
        hasValue(row.controlEffectiveness) ||
        hasValue(row.discoveredOn)
    )
}

function hasControlIdentity(
    row: RawImportRow,
): boolean {
    return (
        hasValue(row.category) ||
        hasValue(row.cost) ||
        hasValue(row.riskReductionPct)
    )
}

function hasInsiderIdentity(
    row: RawImportRow,
): boolean {
    return (
        hasValue(row.employeeDepartment) ||
        hasValue(row.employeeCampus) ||
        hasValue(row.employeePosition) ||
        hasValue(row.employeeSeniorityYears) ||
        hasValue(row.isContractor) ||
        hasValue(row.employeeClassification) ||
        hasValue(row.hasForeignCitizenship) ||
        hasValue(row.hasCriminalRecord) ||
        hasValue(row.hasMedicalHistory) ||
        hasValue(row.employeeOriginCountry) ||
        hasValue(row.totalPrintedPages) ||
        hasValue(row.numPrintedPagesOffHours) ||
        hasValue(row.totalFilesBurned) ||
        hasValue(row.burnedFromOther) ||
        hasValue(row.isAbroad) ||
        hasValue(row.tripDayNumber) ||
        hasValue(row.hostilityCountryLevel) ||
        hasValue(row.numEntries) ||
        hasValue(row.numUniqueCampus) ||
        hasValue(row.lateExitFlag) ||
        hasValue(row.entryDuringWeekend) ||
        hasValue(row.isMalicious)
    )
}

function mapGenericRow(
    row: RawImportRow,
): RawImportRow | null {
    if (countMeaningfulFields(row) === 0) {
        return null
    }

    return { ...row }
}

export function mapRowToDataset(
    row: RawImportRow,
    type: DatasetType,
): RawImportRow | null {
    if (type === 'generic') {
        return mapGenericRow(row)
    }

    const mapped = mapRow(row, type)

    if (!isMeaningfulDatasetRow(mapped, type)) {
        return null
    }

    return mapped
}

export function mapRowsToDataset(
    rows: RawImportRow[],
    type: DatasetType,
): RawImportRow[] {
    return rows
        .map((row) =>
            mapRowToDataset(row, type),
        )
        .filter(
            (row): row is RawImportRow =>
                row !== null,
        )
}

export function mapMixedRow(
    row: RawImportRow,
): Partial<Record<DatasetType, RawImportRow>> {
    const result: Partial<
        Record<DatasetType, RawImportRow>
    > = {}

    const asset = mapRow(row, 'assets')
    const vulnerability = mapRow(
        row,
        'vulnerabilities',
    )
    const control = mapRow(row, 'controls')
    const insiderThreat = mapRow(
        row,
        'insiderThreat',
    )

    const hasAssetSpecificFields =
        hasAssetIdentity(asset)

    const hasVulnerabilitySpecificFields =
        hasVulnerabilityIdentity(vulnerability)

    const hasControlSpecificFields =
        hasControlIdentity(control)

    const hasInsiderSpecificFields =
        hasInsiderIdentity(insiderThreat)

    if (
        hasValue(asset.name) &&
        (
            hasAssetSpecificFields ||
            (
                !hasVulnerabilitySpecificFields &&
                !hasControlSpecificFields &&
                !hasInsiderSpecificFields
            )
        )
    ) {
        result.assets = asset
    }

    if (
        hasValue(vulnerability.name) &&
        (
            hasVulnerabilitySpecificFields ||
            hasValue(vulnerability.assetId)
        )
    ) {
        result.vulnerabilities = vulnerability
    }

    if (
        hasValue(control.name) &&
        hasControlSpecificFields
    ) {
        result.controls = control
    }

    if (hasInsiderSpecificFields) {
        result.insiderThreat = insiderThreat
    }

    if (Object.keys(result).length === 0) {
        const generic = mapGenericRow(row)

        if (generic) {
            result.generic = generic
        }
    }

    return result
}

export function mapMixedRows(
    rows: RawImportRow[],
): Partial<Record<DatasetType, RawImportRow>>[] {
    return rows
        .map((row) => mapMixedRow(row))
        .filter(
            (mapped) =>
                Object.keys(mapped).length > 0,
        )
}

export function splitMixedRows(
    rows: RawImportRow[],
): Record<DatasetType, RawImportRow[]> {
    const result: Record<
        DatasetType,
        RawImportRow[]
    > = {
        assets: [],
        vulnerabilities: [],
        controls: [],
        insiderThreat: [],
        generic: [],
    }

    for (const row of rows) {
        const mapped = mapMixedRow(row)

        for (const type of DATASET_TYPES) {
            const datasetRow = mapped[type]

            if (!datasetRow) {
                continue
            }

            result[type].push(datasetRow)
        }
    }

    return result
}