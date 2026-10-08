import type {
    DatasetDetectionResult,
    DatasetType,
    RawImportRow,
} from './import.types.js'

type DetectionRule = {
    type: Exclude<DatasetType, 'generic'>
    fields: string[]
    keywords: string[]
}

const DETECTION_RULES: DetectionRule[] = [
    {
        type: 'assets',
        fields: [
            'asset',
            'asset_id',
            'asset_name',
            'asset_type',
            'hostname',
            'host_name',
            'server',
            'device',
            'system',
            'resource',
            'asset_value',
            'value',
            'criticality',
            'internet_exposed',
            'internet_exposure',
        ],
        keywords: [
            'asset',
            'hostname',
            'host',
            'server',
            'device',
            'system',
            'resource',
            'criticality',
            'internet',
            'exposed',
        ],
    },

    {
        type: 'vulnerabilities',
        fields: [
            'vulnerability',
            'vulnerability_id',
            'vulnerability_name',
            'cve',
            'cve_id',
            'cvss',
            'cvss_score',
            'severity',
            'exploit',
            'exploit_available',
            'affected_asset',
            'asset_id',
            'asset_name',
            'discovered_on',
            'discovery_date',
        ],
        keywords: [
            'vulnerability',
            'vuln',
            'cve',
            'cvss',
            'exploit',
            'severity',
            'affected',
            'discovery',
        ],
    },

    {
        type: 'controls',
        fields: [
            'control',
            'control_id',
            'control_name',
            'control_type',
            'security_control',
            'security_control_name',
            'control_category',
            'control_cost',
            'cost',
            'risk_reduction',
            'risk_reduction_pct',
            'effectiveness',
            'control_effectiveness',
        ],
        keywords: [
            'control',
            'security_control',
            'safeguard',
            'mitigation',
            'countermeasure',
            'risk_reduction',
            'effectiveness',
            'control_cost',
        ],
    },

    {
        type: 'insiderThreat',
        fields: [
            'employee_department',
            'employee_campus',
            'employee_position',
            'employee_seniority_years',
            'is_contractor',
            'employee_classification',
            'has_foreign_citizenship',
            'has_criminal_record',
            'has_medical_history',
            'employee_origin_country',
            'total_printed_pages',
            'num_printed_pages_off_hours',
            'total_files_burned',
            'burned_from_other',
            'is_abroad',
            'trip_day_number',
            'hostility_country_level',
            'num_entries',
            'num_unique_campus',
            'late_exit_flag',
            'entry_during_weekend',
            'is_malicious',
        ],
        keywords: [
            'employee',
            'contractor',
            'citizenship',
            'criminal',
            'medical',
            'printed',
            'pages',
            'burned',
            'abroad',
            'trip',
            'hostility',
            'campus',
            'malicious',
            'seniority',
        ],
    },
]

function normalizeKey(value: unknown): string {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[\s\-./]+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
}

function normalizeText(value: unknown): string {
    return String(value ?? '')
        .trim()
        .toLowerCase()
}

function getKeys(rows: RawImportRow[]): string[] {
    const keys = new Set<string>()

    for (const row of rows) {
        for (const key of Object.keys(row)) {
            keys.add(normalizeKey(key))
        }
    }

    return Array.from(keys)
}

function getValues(rows: RawImportRow[]): unknown[] {
    const values: unknown[] = []

    for (const row of rows.slice(0, 10)) {
        for (const value of Object.values(row)) {
            if (
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ''
            ) {
                values.push(value)
            }
        }
    }

    return values
}

function fieldMatches(
    key: string,
    rule: DetectionRule,
): boolean {
    if (rule.fields.includes(key)) {
        return true
    }

    return rule.keywords.some(
        (keyword) =>
            key === keyword ||
            key.startsWith(`${keyword}_`) ||
            key.endsWith(`_${keyword}`),
    )
}

function valueMatchesType(
    type: Exclude<DatasetType, 'generic'>,
    values: unknown[],
): number {
    if (values.length === 0) {
        return 0
    }

    let matches = 0

    for (const value of values) {
        const text = normalizeText(value)

        if (!text) {
            continue
        }

        if (
            type === 'vulnerabilities' &&
            (
                /^cve-\d{4}-\d+$/i.test(text) ||
                text.includes('critical') ||
                text.includes('high') ||
                text.includes('medium') ||
                text.includes('low')
            )
        ) {
            matches += 1
        }

        if (
            type === 'assets' &&
            (
                text.includes('server') ||
                text.includes('database') ||
                text.includes('laptop') ||
                text.includes('endpoint') ||
                text.includes('application')
            )
        ) {
            matches += 1
        }

        if (
            type === 'controls' &&
            (
                text.includes('firewall') ||
                text.includes('mfa') ||
                text.includes('multi-factor') ||
                text.includes('encryption') ||
                text.includes('backup') ||
                text.includes('antivirus') ||
                text.includes('access control')
            )
        ) {
            matches += 1
        }

        if (
            type === 'insiderThreat' &&
            (
                text === 'true' ||
                text === 'false' ||
                text === 'yes' ||
                text === 'no'
            )
        ) {
            matches += 1
        }
    }

    return Math.min(
        20,
        Math.round(
            (matches / values.length) * 20,
        ),
    )
}

function scoreRule(
    rows: RawImportRow[],
    rule: DetectionRule,
): {
    score: number
    matchedFields: string[]
} {
    const keys = getKeys(rows)

    const matchedFields = keys.filter(
        (key) => fieldMatches(key, rule),
    )

    if (matchedFields.length === 0) {
        return {
            score: 0,
            matchedFields: [],
        }
    }

    const fieldScore = Math.min(
        80,
        matchedFields.length * 20,
    )

    const valueScore = valueMatchesType(
        rule.type,
        getValues(rows),
    )

    return {
        score: Math.min(
            100,
            fieldScore + valueScore,
        ),
        matchedFields,
    }
}

export function detectDatasetType(
    rows: RawImportRow[],
): DatasetDetectionResult {
    if (rows.length === 0) {
        return {
            type: null,
            confidence: 0,
            matchedFields: [],
        }
    }

    const results = DETECTION_RULES.map(
        (rule) => {
            const result = scoreRule(
                rows,
                rule,
            )

            return {
                type: rule.type,
                score: result.score,
                matchedFields: result.matchedFields,
            }
        },
    )

    results.sort(
        (a, b) => b.score - a.score,
    )

    const best = results[0]

    if (!best || best.score < 20) {
        return {
            type: 'generic',
            confidence: 0,
            matchedFields: [],
        }
    }

    return {
        type: best.type,
        confidence: Math.min(
            1,
            best.score / 100,
        ),
        matchedFields: best.matchedFields,
    }
}

export function detectDatasetTypes(
    rows: RawImportRow[],
): DatasetDetectionResult[] {
    if (rows.length === 0) {
        return []
    }

    const results = DETECTION_RULES.map(
        (rule) => {
            const result = scoreRule(
                rows,
                rule,
            )

            return {
                type: rule.type,
                confidence: Math.min(
                    1,
                    result.score / 100,
                ),
                matchedFields: result.matchedFields,
            }
        },
    )

    const detected = results
        .filter(
            (result) =>
                result.confidence >= 0.2,
        )
        .sort(
            (a, b) =>
                b.confidence -
                a.confidence,
        )

    if (detected.length > 0) {
        return detected
    }

    return [
        {
            type: 'generic',
            confidence: 0,
            matchedFields: [],
        },
    ]
}