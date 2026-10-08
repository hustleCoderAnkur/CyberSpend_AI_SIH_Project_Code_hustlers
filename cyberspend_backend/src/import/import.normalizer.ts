import type {
    NormalizedAsset,
    NormalizedControl,
    NormalizedInsiderThreat,
    NormalizedVulnerability,
    RawImportRow,
} from './import.types.js'

type FieldAliases = Record<string, string[]>

const FIELD_ALIASES: FieldAliases = {
    id: [
        'id',
        'asset_id',
        'assetid',
        'vulnerability_id',
        'vulnerabilityid',
        'control_id',
        'controlid',
        'event_id',
        'eventid',
        'record_id',
        'recordid',
    ],

    assetName: [
        'asset_name',
        'asset name',
        'assetname',
        'asset',
        'name',
        'system_name',
        'system name',
        'systemname',
        'application_name',
        'application name',
        'applicationname',
    ],

    category: [
        'category',
        'asset_category',
        'asset category',
        'assetcategory',
        'type',
        'asset_type',
        'asset type',
        'assettype',
    ],

    value: [
        'value',
        'asset_value',
        'asset value',
        'assetvalue',
        'business_value',
        'business value',
        'businessvalue',
        'financial_value',
        'financial value',
        'financialvalue',
    ],

    criticality: [
        'criticality',
        'criticality_level',
        'criticality level',
        'criticalitylevel',
        'critical',
        'risk_level',
        'risk level',
        'risklevel',
        'priority',
    ],

    internetExposed: [
        'internet_exposed',
        'internet exposed',
        'internetexposed',
        'internet_exposure',
        'internet exposure',
        'internetexposure',
        'internet_facing',
        'internet facing',
        'internetfacing',
        'externally_exposed',
        'externally exposed',
        'external_exposure',
        'publicly_accessible',
        'publicly accessible',
    ],

    vulnerabilityName: [
        'vulnerability_name',
        'vulnerability name',
        'vulnerabilityname',
        'vulnerability',
        'name',
        'title',
        'description',
        'finding',
        'finding_name',
        'finding name',
    ],

    assetId: [
        'asset_id',
        'asset id',
        'assetid',
        'asset',
        'affected_asset',
        'affected asset',
        'affectedasset',
        'resource_id',
        'resource id',
        'resourceid',
    ],

    cvss: [
        'cvss',
        'cvss_score',
        'cvss score',
        'cvssscore',
        'cvss_v3',
        'cvss v3',
        'cvssv3',
        'cvss_v3_score',
        'severity_score',
        'severity score',
    ],

    exploitAvailable: [
        'exploit_available',
        'exploit available',
        'exploitavailable',
        'exploit',
        'exploit_exists',
        'exploit exists',
        'exploitexists',
        'has_exploit',
        'has exploit',
        'exploitable',
    ],

    controlEffectiveness: [
        'control_effectiveness',
        'control effectiveness',
        'controleffectiveness',
        'control_effectiveness_pct',
        'control effectiveness pct',
        'control_effectiveness_percent',
        'control effectiveness percent',
        'effectiveness',
        'effectiveness_pct',
        'effectiveness percent',
    ],

    discoveredOn: [
        'discovered_on',
        'discovered on',
        'discoveredon',
        'discovery_date',
        'discovery date',
        'discoverydate',
        'date_discovered',
        'date discovered',
        'date_found',
        'date found',
    ],

    controlName: [
        'control_name',
        'control name',
        'controlname',
        'control',
        'name',
        'security_control',
        'security control',
        'securitycontrol',
    ],

    controlCategory: [
        'control_category',
        'control category',
        'controlcategory',
        'category',
        'type',
        'control_type',
        'control type',
    ],

    cost: [
        'cost',
        'control_cost',
        'control cost',
        'controlcost',
        'implementation_cost',
        'implementation cost',
        'implementationcost',
        'investment',
        'investment_cost',
        'investment cost',
    ],

    riskReductionPct: [
        'risk_reduction_pct',
        'risk reduction pct',
        'riskreductionpct',
        'risk_reduction',
        'risk reduction',
        'riskreduction',
        'risk_reduction_percent',
        'risk reduction percent',
        'riskreductionpercent',
        'reduction_pct',
        'reduction percent',
        'reduction',
    ],

    employeeDepartment: [
        'employee_department',
        'employee department',
        'employeedepartment',
        'department',
        'employee_dept',
        'employee dept',
        'dept',
    ],

    employeeCampus: [
        'employee_campus',
        'employee campus',
        'employeecampus',
        'campus',
        'location',
        'employee_location',
        'employee location',
    ],

    employeePosition: [
        'employee_position',
        'employee position',
        'employeeposition',
        'position',
        'job_position',
        'job position',
        'job_title',
        'job title',
        'role',
    ],

    employeeSeniorityYears: [
        'employee_seniority_years',
        'employee seniority years',
        'employeeseniorityyears',
        'seniority_years',
        'seniority years',
        'seniority',
        'years_at_company',
        'years at company',
        'years_of_service',
        'years of service',
    ],

    isContractor: [
        'is_contractor',
        'is contractor',
        'iscontractor',
        'contractor',
        'contract_employee',
        'contract employee',
    ],

    employeeClassification: [
        'employee_classification',
        'employee classification',
        'employeeclassification',
        'classification',
        'employee_type',
        'employee type',
        'employment_type',
        'employment type',
    ],

    hasForeignCitizenship: [
        'has_foreign_citizenship',
        'has foreign citizenship',
        'hasforeigncitizenship',
        'foreign_citizenship',
        'foreign citizenship',
        'foreigncitizenship',
        'foreign_national',
        'foreign national',
    ],

    hasCriminalRecord: [
        'has_criminal_record',
        'has criminal record',
        'hascriminalrecord',
        'criminal_record',
        'criminal record',
        'criminalrecord',
    ],

    hasMedicalHistory: [
        'has_medical_history',
        'has medical history',
        'hasmedicalhistory',
        'medical_history',
        'medical history',
        'medicalhistory',
    ],

    employeeOriginCountry: [
        'employee_origin_country',
        'employee origin country',
        'employeeorigincountry',
        'origin_country',
        'origin country',
        'origincountry',
        'country',
        'employee_country',
        'employee country',
    ],

    totalPrintedPages: [
        'total_printed_pages',
        'total printed pages',
        'totalprintedpages',
        'printed_pages',
        'printed pages',
        'total_pages_printed',
        'total pages printed',
    ],

    numPrintedPagesOffHours: [
        'num_printed_pages_off_hours',
        'num printed pages off hours',
        'numprintedpagesoffhours',
        'printed_pages_off_hours',
        'printed pages off hours',
        'off_hours_printed_pages',
        'off hours printed pages',
    ],

    totalFilesBurned: [
        'total_files_burned',
        'total files burned',
        'totalfilesburned',
        'files_burned',
        'files burned',
        'total_burned_files',
        'total burned files',
    ],

    burnedFromOther: [
        'burned_from_other',
        'burned from other',
        'burnedfromother',
        'files_burned_from_other',
        'files burned from other',
        'burned_other',
    ],

    isAbroad: [
        'is_abroad',
        'is abroad',
        'isabroad',
        'abroad',
        'outside_country',
        'outside country',
        'overseas',
    ],

    tripDayNumber: [
        'trip_day_number',
        'trip day number',
        'tripdaynumber',
        'trip_day',
        'trip day',
        'day_of_trip',
        'day of trip',
    ],

    hostilityCountryLevel: [
        'hostility_country_level',
        'hostility country level',
        'hostilitycountrylevel',
        'country_hostility_level',
        'country hostility level',
        'hostility_level',
        'hostility level',
    ],

    numEntries: [
        'num_entries',
        'num entries',
        'numentries',
        'entries',
        'entry_count',
        'entry count',
        'number_of_entries',
        'number of entries',
    ],

    numUniqueCampus: [
        'num_unique_campus',
        'num unique campus',
        'numuniquecampus',
        'unique_campus',
        'unique campus',
        'unique_campus_count',
        'unique campus count',
    ],

    lateExitFlag: [
        'late_exit_flag',
        'late exit flag',
        'lateexitflag',
        'late_exit',
        'late exit',
        'lateexit',
        'left_late',
        'left late',
    ],

    entryDuringWeekend: [
        'entry_during_weekend',
        'entry during weekend',
        'entryduringweekend',
        'weekend_entry',
        'weekend entry',
        'weekend_visit',
        'weekend visit',
    ],

    isMalicious: [
        'is_malicious',
        'is malicious',
        'ismalicious',
        'malicious',
        'malicious_flag',
        'malicious flag',
        'label',
        'target',
    ],
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

function getField(
    row: RawImportRow,
    aliases: string[],
): unknown {
    const entries = Object.entries(row)

    for (const alias of aliases) {
        const normalizedAlias =
            normalizeKey(alias)

        const match = entries.find(
            ([key]) =>
                normalizeKey(key) ===
                normalizedAlias,
        )

        if (match) {
            return match[1]
        }
    }

    return undefined
}

function getValue(
    row: RawImportRow,
    field: keyof typeof FIELD_ALIASES,
): unknown {
    return getField(
        row,
        FIELD_ALIASES[field],
    )
}

function toText(value: unknown): string {
    return String(value ?? '').trim()
}

function toNumber(value: unknown): number {
    if (typeof value === 'number') {
        return Number.isFinite(value)
            ? value
            : 0
    }

    const normalized = String(value ?? '')
        .replace(/,/g, '')
        .replace(/₹/g, '')
        .replace(/\$/g, '')
        .replace(/%/g, '')
        .trim()

    if (!normalized) {
        return 0
    }

    const parsed = Number(normalized)

    return Number.isFinite(parsed)
        ? parsed
        : 0
}

function toInteger(value: unknown): number {
    return Math.trunc(toNumber(value))
}

function toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value
    }

    const normalized = String(value ?? '')
        .trim()
        .toLowerCase()

    return [
        'true',
        '1',
        'yes',
        'y',
        'on',
        'enabled',
    ].includes(normalized)
}

function toBinary(value: unknown): number {
    return toBoolean(value) ? 1 : 0
}

function toNullableNumber(
    value: unknown,
): number | null {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ''
    ) {
        return null
    }

    const parsed = toNumber(value)

    return Number.isFinite(parsed)
        ? parsed
        : null
}

function normalizePercentage(
    value: unknown,
): number {
    const raw = toNumber(value)

    if (raw <= 1) {
        return Math.max(
            0,
            Math.min(1, raw),
        )
    }

    return Math.max(
        0,
        Math.min(1, raw / 100),
    )
}

function normalizeCriticality(
    value: unknown,
): 'Low' | 'Medium' | 'High' | 'Critical' {
    const normalized = String(value ?? '')
        .trim()
        .toLowerCase()

    if (
        normalized.includes('critical') ||
        normalized === '4' ||
        normalized === 'p1'
    ) {
        return 'Critical'
    }

    if (
        normalized.includes('high') ||
        normalized === '3' ||
        normalized === 'p2'
    ) {
        return 'High'
    }

    if (
        normalized.includes('medium') ||
        normalized.includes('moderate') ||
        normalized === '2' ||
        normalized === 'p3'
    ) {
        return 'Medium'
    }

    return 'Low'
}

function normalizeDate(
    value: unknown,
): Date {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? new Date()
            : value
    }

    const parsed = new Date(
        String(value ?? '').trim(),
    )

    return Number.isNaN(parsed.getTime())
        ? new Date()
        : parsed
}

function generateId(
    prefix: string,
    index: number,
): string {
    return `${prefix}-${String(index + 1).padStart(6, '0')}`
}

export function normalizeAsset(
    row: RawImportRow,
    index: number,
): NormalizedAsset {
    return {
        id:
            toText(getValue(row, 'id')) ||
            generateId('AST', index),

        name:
            toText(
                getValue(row, 'assetName'),
            ) ||
            `Asset ${index + 1}`,

        category:
            toText(
                getValue(row, 'category'),
            ) ||
            'Uncategorized',

        value: Math.max(
            0,
            toNumber(
                getValue(row, 'value'),
            ),
        ),

        criticality:
            normalizeCriticality(
                getValue(
                    row,
                    'criticality',
                ),
            ),

        internetExposed:
            toBoolean(
                getValue(
                    row,
                    'internetExposed',
                ),
            ),
    }
}

export function normalizeVulnerability(
    row: RawImportRow,
    index: number,
): NormalizedVulnerability {
    const cvss = Math.max(
        0,
        Math.min(
            10,
            toNumber(
                getValue(row, 'cvss'),
            ),
        ),
    )

    return {
        id:
            toText(getValue(row, 'id')) ||
            generateId('VUL', index),

        assetId: toText(
            getValue(row, 'assetId'),
        ),

        name:
            toText(
                getValue(
                    row,
                    'vulnerabilityName',
                ),
            ) ||
            `Vulnerability ${index + 1}`,

        cvss,

        exploitAvailable:
            toBoolean(
                getValue(
                    row,
                    'exploitAvailable',
                ),
            ),

        controlEffectiveness:
            normalizePercentage(
                getValue(
                    row,
                    'controlEffectiveness',
                ),
            ),

        discoveredOn:
            normalizeDate(
                getValue(
                    row,
                    'discoveredOn',
                ),
            ),
    }
}

export function normalizeControl(
    row: RawImportRow,
    index: number,
): NormalizedControl {
    return {
        id:
            toText(getValue(row, 'id')) ||
            generateId('CTL', index),

        name:
            toText(
                getValue(
                    row,
                    'controlName',
                ),
            ) ||
            `Security Control ${index + 1}`,

        category:
            toText(
                getValue(
                    row,
                    'controlCategory',
                ),
            ) ||
            'General',

        cost: Math.max(
            0,
            toNumber(
                getValue(row, 'cost'),
            ),
        ),

        riskReductionPct:
            normalizePercentage(
                getValue(
                    row,
                    'riskReductionPct',
                ),
            ),
    }
}

export function normalizeInsiderThreat(
    row: RawImportRow,
    index: number,
): NormalizedInsiderThreat {
    return {
        id:
            toText(getValue(row, 'id')) ||
            generateId('INS', index),

        employeeDepartment: toText(
            getValue(
                row,
                'employeeDepartment',
            ),
        ),

        employeeCampus: toText(
            getValue(
                row,
                'employeeCampus',
            ),
        ),

        employeePosition: toText(
            getValue(
                row,
                'employeePosition',
            ),
        ),

        employeeSeniorityYears:
            Math.max(
                0,
                toInteger(
                    getValue(
                        row,
                        'employeeSeniorityYears',
                    ),
                ),
            ),

        isContractor: toBinary(
            getValue(
                row,
                'isContractor',
            ),
        ),

        employeeClassification:
            toInteger(
                getValue(
                    row,
                    'employeeClassification',
                ),
            ),

        hasForeignCitizenship:
            toBinary(
                getValue(
                    row,
                    'hasForeignCitizenship',
                ),
            ),

        hasCriminalRecord:
            toBinary(
                getValue(
                    row,
                    'hasCriminalRecord',
                ),
            ),

        hasMedicalHistory:
            toBinary(
                getValue(
                    row,
                    'hasMedicalHistory',
                ),
            ),

        employeeOriginCountry:
            toText(
                getValue(
                    row,
                    'employeeOriginCountry',
                ),
            ),

        totalPrintedPages:
            Math.max(
                0,
                toInteger(
                    getValue(
                        row,
                        'totalPrintedPages',
                    ),
                ),
            ),

        numPrintedPagesOffHours:
            Math.max(
                0,
                toInteger(
                    getValue(
                        row,
                        'numPrintedPagesOffHours',
                    ),
                ),
            ),

        totalFilesBurned:
            Math.max(
                0,
                toInteger(
                    getValue(
                        row,
                        'totalFilesBurned',
                    ),
                ),
            ),

        burnedFromOther: toBinary(
            getValue(
                row,
                'burnedFromOther',
            ),
        ),

        isAbroad: toBinary(
            getValue(
                row,
                'isAbroad',
            ),
        ),

        tripDayNumber:
            toNullableNumber(
                getValue(
                    row,
                    'tripDayNumber',
                ),
            ),

        hostilityCountryLevel:
            toInteger(
                getValue(
                    row,
                    'hostilityCountryLevel',
                ),
            ),

        numEntries: Math.max(
            0,
            toInteger(
                getValue(
                    row,
                    'numEntries',
                ),
            ),
        ),

        numUniqueCampus: Math.max(
            0,
            toInteger(
                getValue(
                    row,
                    'numUniqueCampus',
                ),
            ),
        ),

        lateExitFlag: toBinary(
            getValue(
                row,
                'lateExitFlag',
            ),
        ),

        entryDuringWeekend:
            toBinary(
                getValue(
                    row,
                    'entryDuringWeekend',
                ),
            ),

        isMalicious: toBoolean(
            getValue(
                row,
                'isMalicious',
            ),
        ),
    }
}

export function normalizeAssets(
    rows: RawImportRow[],
): NormalizedAsset[] {
    return rows.map(normalizeAsset)
}

export function normalizeVulnerabilities(
    rows: RawImportRow[],
): NormalizedVulnerability[] {
    return rows.map(
        normalizeVulnerability,
    )
}

export function normalizeControls(
    rows: RawImportRow[],
): NormalizedControl[] {
    return rows.map(normalizeControl)
}

export function normalizeInsiderThreats(
    rows: RawImportRow[],
): NormalizedInsiderThreat[] {
    return rows.map(
        normalizeInsiderThreat,
    )
}

export function normalizeDataset(
    type:
        | 'assets'
        | 'vulnerabilities'
        | 'controls'
        | 'insiderThreat',
    rows: RawImportRow[],
) {
    switch (type) {
        case 'assets':
            return normalizeAssets(rows)

        case 'vulnerabilities':
            return normalizeVulnerabilities(
                rows,
            )

        case 'controls':
            return normalizeControls(rows)

        case 'insiderThreat':
            return normalizeInsiderThreats(
                rows,
            )
    }
}