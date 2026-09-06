import {
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
    type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AlertCircle,
    ArrowRight,
    Bug,
    Check,
    CheckCircle2,
    Database,
    FileJson,
    FileSpreadsheet,
    Loader2,
    Server,
    ShieldCheck,
    Upload,
    UserRoundSearch,
    X,
} from 'lucide-react'

import { apiFetch } from '../api/client'

const IMPORT_STORAGE_KEY = 'cyberspend_import_completed'

type DataType = 'assets' | 'vulnerabilities' | 'controls' | 'insiderThreat'

type Criticality = 'Low' | 'Medium' | 'High' | 'Critical'

type RawRow = Record<string, unknown>

type NormalizedAsset = {
    id: string
    name: string
    category: string
    value: number
    criticality: Criticality
    internetExposed: boolean
}

type NormalizedVulnerability = {
    id: string
    assetId: string
    name: string
    cvss: number
    exploitAvailable: boolean
    controlEffectiveness: number
    discoveredOn: string
}

type NormalizedControl = {
    id: string
    name: string
    category: string
    cost: number
    riskReductionPct: number
}

type NormalizedInsiderThreat = {
    id: string
    employeeDepartment: string
    employeeCampus: string
    employeePosition: string
    employeeSeniorityYears: number
    isContractor: number
    employeeClassification: number
    hasForeignCitizenship: number
    hasCriminalRecord: number
    hasMedicalHistory: number
    employeeOriginCountry: string
    totalPrintedPages: number
    numPrintedPagesOffHours: number
    totalFilesBurned: number
    burnedFromOther: number
    isAbroad: number
    tripDayNumber: number | null
    hostilityCountryLevel: number
    numEntries: number
    numUniqueCampus: number
    lateExitFlag: number
    entryDuringWeekend: number
    isMalicious: boolean
}

type NormalizedRow =
    | NormalizedAsset
    | NormalizedVulnerability
    | NormalizedControl
    | NormalizedInsiderThreat

type UploadedFile = {
    file: File
    type: DataType
    rows: RawRow[]
}

type ImportStats = {
    assets: number
    vulnerabilities: number
    controls: number
    insiderThreatEvents: number
}

type ProcessingStep =
    | 'reading'
    | 'normalizing'
    | 'validating'
    | 'saving'
    | 'risk'
    | 'done'

const DATA_TYPES: Array<{
    value: DataType
    label: string
    description: string
}> = [
        {
            value: 'assets',
            label: 'Asset Inventory',
            description: 'Servers, databases, applications and endpoints',
        },
        {
            value: 'vulnerabilities',
            label: 'Vulnerability Data',
            description: 'CVEs, scanner findings and security weaknesses',
        },
        {
            value: 'controls',
            label: 'Security Controls',
            description: 'MFA, EDR, WAF, patching and other controls',
        },
        {
            value: 'insiderThreat',
            label: 'Insider Threat Data',
            description: 'Employee activity and malicious insider indicators',
        },
    ]

const FIELD_ALIASES: Record<DataType, Record<string, string[]>> = {
    assets: {
        id: ['id', 'asset_id', 'assetid'],
        name: ['name', 'asset_name', 'assetname', 'hostname', 'host'],
        category: ['category', 'type', 'asset_type', 'assettype'],
        value: ['value', 'asset_value', 'assetvalue', 'business_value', 'businessvalue'],
        criticality: ['criticality', 'criticality_level', 'risk_level', 'risklevel', 'severity'],
        internetExposed: [
            'internetexposed',
            'internet_exposed',
            'internet',
            'external',
            'externally_exposed',
            'externallyexposed',
        ],
    },
    vulnerabilities: {
        id: ['id', 'vulnerability_id', 'vulnerabilityid', 'finding_id'],
        assetId: ['assetid', 'asset_id', 'affected_asset', 'affectedasset'],
        name: ['name', 'vulnerability', 'vulnerability_name', 'vulnerabilityname', 'finding', 'title'],
        cvss: ['cvss', 'cvss_score', 'cvssscore', 'cvss_v3'],
        exploitAvailable: ['exploitavailable', 'exploit_available', 'exploit', 'exploitability'],
        controlEffectiveness: [
            'controleffectiveness',
            'control_effectiveness',
            'control_effectiveness_pct',
            'existing_control',
        ],
        discoveredOn: [
            'discoveredon',
            'discovered_on',
            'discovered',
            'discovery_date',
            'discoverydate',
            'date_found',
            'datefound',
        ],
    },
    controls: {
        id: ['id', 'control_id', 'controlid'],
        name: ['name', 'control_name', 'controlname'],
        category: ['category', 'type', 'control_category'],
        cost: ['cost', 'control_cost', 'implementation_cost'],
        riskReductionPct: [
            'riskreductionpct',
            'risk_reduction_pct',
            'risk_reduction',
            'riskreduction',
            'effectiveness',
        ],
    },
    insiderThreat: {
        employeeDepartment: ['employee_department', 'employee_department_name', 'department'],
        employeeCampus: ['employee_campus', 'campus'],
        employeePosition: ['employee_position', 'position', 'job_position'],
        employeeSeniorityYears: ['employee_seniority_years', 'seniority_years', 'seniority'],
        isContractor: ['is_contractor', 'contractor'],
        employeeClassification: ['employee_classification', 'classification'],
        hasForeignCitizenship: ['has_foreign_citizenship', 'foreign_citizenship'],
        hasCriminalRecord: ['has_criminal_record', 'criminal_record'],
        hasMedicalHistory: ['has_medical_history', 'medical_history'],
        employeeOriginCountry: ['employee_origin_country', 'origin_country', 'country'],
        totalPrintedPages: ['total_printed_pages', 'printed_pages'],
        numPrintedPagesOffHours: ['num_printed_pages_off_hours', 'printed_pages_off_hours'],
        totalFilesBurned: ['total_files_burned', 'files_burned'],
        burnedFromOther: ['burned_from_other'],
        isAbroad: ['is_abroad', 'abroad'],
        tripDayNumber: ['trip_day_number', 'trip_day'],
        hostilityCountryLevel: ['hostility_country_level', 'country_hostility_level'],
        numEntries: ['num_entries', 'entries'],
        numUniqueCampus: ['num_unique_campus', 'unique_campus'],
        lateExitFlag: ['late_exit_flag', 'late_exit'],
        entryDuringWeekend: ['entry_during_weekend', 'weekend_entry'],
        isMalicious: ['is_malicious', 'malicious', 'is_insider_threat'],
    },
}

const PROCESSING_STEPS: Array<{
    id: ProcessingStep
    label: string
    description: string
}> = [
        {
            id: 'reading',
            label: 'Reading uploaded files',
            description: 'Parsing CSV and JSON records',
        },
        {
            id: 'normalizing',
            label: 'Normalizing security data',
            description: 'Mapping fields into the CyberSpend data model',
        },
        {
            id: 'validating',
            label: 'Validating records',
            description: 'Checking fields and relationships locally',
        },
        {
            id: 'saving',
            label: 'Saving security data',
            description: 'Writing validated data to the security database',
        },
        {
            id: 'risk',
            label: 'Calculating cyber risk',
            description: 'Refreshing the financial risk model',
        },
    ]

function normalizeKey(value: string): string {
    return value.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function getField(row: RawRow, type: DataType, field: string): unknown {
    const aliases = FIELD_ALIASES[type][field] ?? []

    for (const [key, value] of Object.entries(row)) {
        const normalized = normalizeKey(key)

        if (aliases.some((alias) => normalizeKey(alias) === normalized)) {
            return value
        }
    }

    return undefined
}

function parseNumber(value: unknown): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : NaN
    }

    const cleaned = String(value ?? '')
        .replace(/₹/g, '')
        .replace(/,/g, '')
        .replace(/%/g, '')
        .trim()

    const number = Number(cleaned)
    return Number.isFinite(number) ? number : NaN
}

function parseInteger(value: unknown): number {
    const number = parseNumber(value)
    return Number.isInteger(number) ? number : NaN
}

function parseNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || String(value).trim() === '') {
        return null
    }

    const number = parseNumber(value)
    return Number.isFinite(number) ? number : null
}

function parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value

    const normalized = String(value ?? '').trim().toLowerCase()

    if (['true', 'yes', 'y', '1'].includes(normalized)) return true
    if (['false', 'no', 'n', '0', ''].includes(normalized)) return false

    return false
}

function parseBinary(value: unknown): number {
    if (typeof value === 'boolean') return value ? 1 : 0

    const normalized = String(value ?? '').trim().toLowerCase()

    if (['true', 'yes', 'y', '1'].includes(normalized)) return 1
    if (['false', 'no', 'n', '0', ''].includes(normalized)) return 0

    const number = Number(normalized)
    return number === 0 || number === 1 ? number : NaN
}

function generateId(prefix: string, index: number): string {
    return `${prefix}-${String(index + 1).padStart(6, '0')}`
}

function normalizeCriticality(value: unknown): Criticality | null {
    const normalized = String(value ?? '').trim().toLowerCase()

    if (normalized === 'critical') return 'Critical'
    if (normalized === 'high') return 'High'
    if (normalized === 'medium') return 'Medium'
    if (normalized === 'low') return 'Low'

    return null
}

function normalizeDate(value: unknown): string {
    if (!value || String(value).trim() === '') {
        return new Date().toISOString()
    }

    const date = new Date(String(value))

    return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function normalizeRows(rows: RawRow[], type: DataType): NormalizedRow[] {
    if (type === 'assets') {
        return rows.map((row, index) => ({
            id: String(getField(row, type, 'id') || generateId('A', index)).trim(),
            name: String(getField(row, type, 'name') || '').trim(),
            category: String(getField(row, type, 'category') || 'Other').trim(),
            value: parseNumber(getField(row, type, 'value')),
            criticality: normalizeCriticality(getField(row, type, 'criticality')) ?? 'Medium',
            internetExposed: parseBoolean(getField(row, type, 'internetExposed')),
        }))
    }

    if (type === 'vulnerabilities') {
        return rows.map((row, index) => {
            let controlEffectiveness = parseNumber(
                getField(row, type, 'controlEffectiveness'),
            )

            if (Number.isNaN(controlEffectiveness)) {
                controlEffectiveness = 0
            } else if (controlEffectiveness > 1) {
                controlEffectiveness /= 100
            }

            return {
                id: String(getField(row, type, 'id') || generateId('V', index)).trim(),
                assetId: String(getField(row, type, 'assetId') || '').trim(),
                name: String(getField(row, type, 'name') || '').trim(),
                cvss: parseNumber(getField(row, type, 'cvss')),
                exploitAvailable: parseBoolean(getField(row, type, 'exploitAvailable')),
                controlEffectiveness,
                discoveredOn: normalizeDate(getField(row, type, 'discoveredOn')),
            }
        })
    }

    if (type === 'controls') {
        return rows.map((row, index) => {
            let riskReductionPct = parseNumber(getField(row, type, 'riskReductionPct'))

            if (Number.isNaN(riskReductionPct)) {
                riskReductionPct = 0
            } else if (riskReductionPct > 1) {
                riskReductionPct /= 100
            }

            return {
                id: String(getField(row, type, 'id') || generateId('C', index)).trim(),
                name: String(getField(row, type, 'name') || '').trim(),
                category: String(getField(row, type, 'category') || 'Other').trim(),
                cost: parseNumber(getField(row, type, 'cost')),
                riskReductionPct,
            }
        })
    }

    return rows.map((row, index) => ({
        id: generateId('INS', index),
        employeeDepartment: String(getField(row, type, 'employeeDepartment') || '').trim(),
        employeeCampus: String(getField(row, type, 'employeeCampus') || '').trim(),
        employeePosition: String(getField(row, type, 'employeePosition') || '').trim(),
        employeeSeniorityYears: parseInteger(
            getField(row, type, 'employeeSeniorityYears'),
        ),
        isContractor: parseBinary(getField(row, type, 'isContractor')),
        employeeClassification: parseInteger(
            getField(row, type, 'employeeClassification'),
        ),
        hasForeignCitizenship: parseBinary(
            getField(row, type, 'hasForeignCitizenship'),
        ),
        hasCriminalRecord: parseBinary(
            getField(row, type, 'hasCriminalRecord'),
        ),
        hasMedicalHistory: parseBinary(
            getField(row, type, 'hasMedicalHistory'),
        ),
        employeeOriginCountry: String(
            getField(row, type, 'employeeOriginCountry') || '',
        ).trim(),
        totalPrintedPages: parseInteger(
            getField(row, type, 'totalPrintedPages'),
        ),
        numPrintedPagesOffHours: parseInteger(
            getField(row, type, 'numPrintedPagesOffHours'),
        ),
        totalFilesBurned: parseInteger(
            getField(row, type, 'totalFilesBurned'),
        ),
        burnedFromOther: parseBinary(getField(row, type, 'burnedFromOther')),
        isAbroad: parseBinary(getField(row, type, 'isAbroad')),
        tripDayNumber: parseNullableNumber(
            getField(row, type, 'tripDayNumber'),
        ),
        hostilityCountryLevel: parseInteger(
            getField(row, type, 'hostilityCountryLevel'),
        ),
        numEntries: parseInteger(getField(row, type, 'numEntries')),
        numUniqueCampus: parseInteger(
            getField(row, type, 'numUniqueCampus'),
        ),
        lateExitFlag: parseBinary(getField(row, type, 'lateExitFlag')),
        entryDuringWeekend: parseBinary(
            getField(row, type, 'entryDuringWeekend'),
        ),
        isMalicious: parseBoolean(getField(row, type, 'isMalicious')),
    }))
}

function detectDataType(rows: RawRow[]): DataType | null {
    if (!rows.length) return null

    const keys = new Set(Object.keys(rows[0]).map(normalizeKey))

    const has = (type: DataType, field: string): boolean =>
        (FIELD_ALIASES[type][field] ?? []).some((alias) =>
            keys.has(normalizeKey(alias)),
        )

    if (
        has('insiderThreat', 'employeeDepartment') &&
        has('insiderThreat', 'employeePosition') &&
        has('insiderThreat', 'isMalicious')
    ) {
        return 'insiderThreat'
    }

    if (has('vulnerabilities', 'assetId') && has('vulnerabilities', 'cvss')) {
        return 'vulnerabilities'
    }

    if (has('controls', 'cost') && has('controls', 'riskReductionPct')) {
        return 'controls'
    }

    if (has('assets', 'value') && has('assets', 'criticality')) {
        return 'assets'
    }

    return null
}

function parseCsv(text: string): RawRow[] {
    const rows: string[][] = []
    let row: string[] = []
    let cell = ''
    let inQuotes = false

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index]

        if (char === '"') {
            if (inQuotes && text[index + 1] === '"') {
                cell += '"'
                index += 1
            } else {
                inQuotes = !inQuotes
            }
            continue
        }

        if (char === ',' && !inQuotes) {
            row.push(cell)
            cell = ''
            continue
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && text[index + 1] === '\n') {
                index += 1
            }

            row.push(cell)
            cell = ''

            if (row.some((value) => value.trim() !== '')) {
                rows.push(row)
            }

            row = []
            continue
        }

        cell += char
    }

    if (cell.length > 0 || row.length > 0) {
        row.push(cell)

        if (row.some((value) => value.trim() !== '')) {
            rows.push(row)
        }
    }

    if (rows.length < 2) return []

    const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ''))

    return rows.slice(1).map((values) => {
        const result: RawRow = {}

        headers.forEach((header, index) => {
            result[header] = values[index] ?? ''
        })

        return result
    })
}

async function parseDataFile(file: File): Promise<RawRow[]> {
    const text = await file.text()
    const isJson = file.name.toLowerCase().endsWith('.json')

    if (isJson) {
        const parsed: unknown = JSON.parse(text)

        if (Array.isArray(parsed)) {
            return parsed.filter(
                (item): item is RawRow =>
                    typeof item === 'object' && item !== null && !Array.isArray(item),
            )
        }

        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'data' in parsed &&
            Array.isArray((parsed as { data: unknown }).data)
        ) {
            return (parsed as { data: unknown[] }).data.filter(
                (item): item is RawRow =>
                    typeof item === 'object' && item !== null && !Array.isArray(item),
            )
        }

        throw new Error('JSON must contain an array of records or a data array.')
    }

    return parseCsv(text)
}

function validateRows(rows: NormalizedRow[], type: DataType): string[] {
    const errors: string[] = []
    const ids = new Set<string>()

    rows.forEach((row, index) => {
        const rowNumber = index + 2

        if (!row.id) {
            errors.push(`${type} row ${rowNumber}: ID is missing.`)
        } else if (ids.has(row.id)) {
            errors.push(`${type} row ${rowNumber}: duplicate ID "${row.id}".`)
        } else {
            ids.add(row.id)
        }

        if (type === 'assets') {
            const asset = row as NormalizedAsset

            if (!asset.name) errors.push(`Asset row ${rowNumber}: name is missing.`)
            if (!asset.category) {
                errors.push(`Asset row ${rowNumber}: category is missing.`)
            }
            if (!Number.isFinite(asset.value) || asset.value <= 0) {
                errors.push(`Asset row ${rowNumber}: value must be a positive number.`)
            }
        }

        if (type === 'vulnerabilities') {
            const vulnerability = row as NormalizedVulnerability

            if (!vulnerability.assetId) {
                errors.push(`Vulnerability row ${rowNumber}: assetId is missing.`)
            }

            if (!vulnerability.name) {
                errors.push(`Vulnerability row ${rowNumber}: name is missing.`)
            }

            if (
                !Number.isFinite(vulnerability.cvss) ||
                vulnerability.cvss < 0 ||
                vulnerability.cvss > 10
            ) {
                errors.push(
                    `Vulnerability row ${rowNumber}: CVSS must be between 0 and 10.`,
                )
            }

            if (
                !Number.isFinite(vulnerability.controlEffectiveness) ||
                vulnerability.controlEffectiveness < 0 ||
                vulnerability.controlEffectiveness > 1
            ) {
                errors.push(
                    `Vulnerability row ${rowNumber}: control effectiveness must be between 0 and 100%.`,
                )
            }

            if (
                !vulnerability.discoveredOn ||
                Number.isNaN(new Date(vulnerability.discoveredOn).getTime())
            ) {
                errors.push(
                    `Vulnerability row ${rowNumber}: discoveredOn must be a valid date.`,
                )
            }
        }

        if (type === 'controls') {
            const control = row as NormalizedControl

            if (!control.name) errors.push(`Control row ${rowNumber}: name is missing.`)
            if (!control.category) {
                errors.push(`Control row ${rowNumber}: category is missing.`)
            }
            if (!Number.isFinite(control.cost) || control.cost <= 0) {
                errors.push(`Control row ${rowNumber}: cost must be positive.`)
            }
            if (
                !Number.isFinite(control.riskReductionPct) ||
                control.riskReductionPct < 0 ||
                control.riskReductionPct > 1
            ) {
                errors.push(
                    `Control row ${rowNumber}: risk reduction must be between 0 and 100%.`,
                )
            }
        }

        if (type === 'insiderThreat') {
            const insider = row as NormalizedInsiderThreat

            if (!insider.employeeDepartment) {
                errors.push(
                    `Insider threat row ${rowNumber}: employee department is missing.`,
                )
            }
            if (!insider.employeeCampus) {
                errors.push(
                    `Insider threat row ${rowNumber}: employee campus is missing.`,
                )
            }
            if (!insider.employeePosition) {
                errors.push(
                    `Insider threat row ${rowNumber}: employee position is missing.`,
                )
            }
            if (
                !Number.isInteger(insider.employeeSeniorityYears) ||
                insider.employeeSeniorityYears < 0
            ) {
                errors.push(
                    `Insider threat row ${rowNumber}: employee seniority years must be a non-negative integer.`,
                )
            }

            const binaryFields: Array<[string, number]> = [
                ['isContractor', insider.isContractor],
                ['hasForeignCitizenship', insider.hasForeignCitizenship],
                ['hasCriminalRecord', insider.hasCriminalRecord],
                ['hasMedicalHistory', insider.hasMedicalHistory],
                ['burnedFromOther', insider.burnedFromOther],
                ['isAbroad', insider.isAbroad],
                ['lateExitFlag', insider.lateExitFlag],
                ['entryDuringWeekend', insider.entryDuringWeekend],
            ]

            binaryFields.forEach(([field, value]) => {
                if (!Number.isInteger(value) || (value !== 0 && value !== 1)) {
                    errors.push(
                        `Insider threat row ${rowNumber}: ${field} must be 0 or 1.`,
                    )
                }
            })

            const nonNegativeFields: Array<[string, number]> = [
                ['totalPrintedPages', insider.totalPrintedPages],
                ['numPrintedPagesOffHours', insider.numPrintedPagesOffHours],
                ['totalFilesBurned', insider.totalFilesBurned],
                ['numEntries', insider.numEntries],
                ['numUniqueCampus', insider.numUniqueCampus],
            ]

            nonNegativeFields.forEach(([field, value]) => {
                if (!Number.isInteger(value) || value < 0) {
                    errors.push(
                        `Insider threat row ${rowNumber}: ${field} must be a non-negative integer.`,
                    )
                }
            })

            if (!Number.isInteger(insider.employeeClassification)) {
                errors.push(
                    `Insider threat row ${rowNumber}: employee classification must be an integer.`,
                )
            }

            if (!Number.isInteger(insider.hostilityCountryLevel)) {
                errors.push(
                    `Insider threat row ${rowNumber}: hostility country level must be an integer.`,
                )
            }

            if (
                insider.tripDayNumber !== null &&
                !Number.isFinite(insider.tripDayNumber)
            ) {
                errors.push(
                    `Insider threat row ${rowNumber}: trip day number must be numeric or empty.`,
                )
            }

            if (!insider.employeeOriginCountry) {
                errors.push(
                    `Insider threat row ${rowNumber}: employee origin country is missing.`,
                )
            }
        }
    })

    return errors
}

function buildCompanyPayload(files: UploadedFile[]) {
    const payload: {
        assets: NormalizedAsset[]
        vulnerabilities: NormalizedVulnerability[]
        controls: NormalizedControl[]
    } = {
        assets: [],
        vulnerabilities: [],
        controls: [],
    }

    files.forEach((item) => {
        if (item.type === 'insiderThreat') return

        const rows = normalizeRows(item.rows, item.type)

        if (item.type === 'assets') {
            payload.assets.push(...(rows as NormalizedAsset[]))
        }

        if (item.type === 'vulnerabilities') {
            payload.vulnerabilities.push(...(rows as NormalizedVulnerability[]))
        }

        if (item.type === 'controls') {
            payload.controls.push(...(rows as NormalizedControl[]))
        }
    })

    return payload
}

function buildInsiderPayload(files: UploadedFile[]): NormalizedInsiderThreat[] {
    const result: NormalizedInsiderThreat[] = []

    files.forEach((item) => {
        if (item.type !== 'insiderThreat') return

        result.push(...(normalizeRows(item.rows, item.type) as NormalizedInsiderThreat[]))
    })

    return result
}

function validateRelationships(
    payload: ReturnType<typeof buildCompanyPayload>,
): string[] {
    const errors: string[] = []

    if (payload.vulnerabilities.length > 0 && payload.assets.length === 0) {
        errors.push('Assets are required when vulnerability data is uploaded.')
        return errors
    }

    const assetIds = new Set(payload.assets.map((asset) => asset.id))

    payload.vulnerabilities.forEach((vulnerability, index) => {
        if (!assetIds.has(vulnerability.assetId)) {
            errors.push(
                `Vulnerability row ${index + 2}: assetId "${vulnerability.assetId}" does not match an uploaded asset.`,
            )
        }
    })

    return errors
}

function stepState(
    step: ProcessingStep,
    current: ProcessingStep,
): 'complete' | 'active' | 'pending' {
    const order: ProcessingStep[] = [
        'reading',
        'normalizing',
        'validating',
        'saving',
        'risk',
        'done',
    ]

    const stepIndex = order.indexOf(step)
    const currentIndex = order.indexOf(current)

    if (stepIndex < currentIndex) return 'complete'
    if (step === current) return 'active'
    return 'pending'
}

function FileIcon({ fileName }: { fileName: string }) {
    return fileName.toLowerCase().endsWith('.json') ? (
        <FileJson size={20} />
    ) : (
        <FileSpreadsheet size={20} />
    )
}

function DatasetIcon({ type }: { type: DataType }) {
    if (type === 'assets') return <Server size={18} />
    if (type === 'vulnerabilities') return <Bug size={18} />
    if (type === 'controls') return <ShieldCheck size={18} />
    return <UserRoundSearch size={18} />
}

function ProcessingIcon({
    state,
}: {
    state: 'complete' | 'active' | 'pending'
}) {
    if (state === 'complete') {
        return (
            <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{
                    background: 'var(--status-success-bg)',
                    color: 'var(--status-success-text)',
                }}
            >
                <Check size={13} />
            </div>
        )
    }

    if (state === 'active') {
        return (
            <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{
                    background: 'var(--bg-surface-raised)',
                    color: 'var(--text-primary)',
                }}
            >
                <Loader2 size={14} className="animate-spin" />
            </div>
        )
    }

    return (
        <div
            className="h-6 w-6 rounded-full border"
            style={{ borderColor: 'var(--border-hairline)' }}
        />
    )
}

function SummaryCard({
    icon,
    value,
    label,
}: {
    icon: ReactNode
    value: number
    label: string
}) {
    return (
        <div
            className="rounded-xl border p-4 text-center"
            style={{
                borderColor: 'var(--border-hairline)',
                background: 'var(--bg-surface)',
            }}
        >
            <div
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                    background: 'var(--bg-surface-raised)',
                    color: 'var(--text-secondary)',
                }}
            >
                {icon}
            </div>
            <p
                className="mt-3 text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
            >
                {value}
            </p>
            <p
                className="mt-1 text-xs"
                style={{ color: 'var(--text-tertiary)' }}
            >
                {label}
            </p>
        </div>
    )
}

export default function CompanyDataImport() {
    const navigate = useNavigate()
    const inputRef = useRef<HTMLInputElement>(null)

    const [activeType, setActiveType] = useState<DataType>('assets')
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [processing, setProcessing] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [processingStep, setProcessingStep] =
        useState<ProcessingStep>('reading')
    const [error, setError] = useState('')
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [importStats, setImportStats] = useState<ImportStats>({
        assets: 0,
        vulnerabilities: 0,
        controls: 0,
        insiderThreatEvents: 0,
    })

    const activeFile = uploadedFiles.find(
        (item) => item.type === activeType,
    )

    const activeRows = useMemo(
        () => (activeFile ? normalizeRows(activeFile.rows, activeFile.type) : []),
        [activeFile],
    )

    const companyPayload = useMemo(
        () => buildCompanyPayload(uploadedFiles),
        [uploadedFiles],
    )

    const insiderPayload = useMemo(
        () => buildInsiderPayload(uploadedFiles),
        [uploadedFiles],
    )

    const relationshipErrors = useMemo(
        () => validateRelationships(companyPayload),
        [companyPayload],
    )

    const allLocalErrors = useMemo(() => {
        const errors = uploadedFiles.flatMap((item) =>
            validateRows(normalizeRows(item.rows, item.type), item.type),
        )

        return [...errors, ...relationshipErrors]
    }, [uploadedFiles, relationshipErrors])

    const totalRecords =
        companyPayload.assets.length +
        companyPayload.vulnerabilities.length +
        companyPayload.controls.length +
        insiderPayload.length

    async function handleFile(file: File) {
        const name = file.name.toLowerCase()

        if (!name.endsWith('.csv') && !name.endsWith('.json')) {
            setError('Only CSV and JSON files are supported.')
            return
        }

        try {
            setError('')
            setValidationErrors([])

            const rows = await parseDataFile(file)

            if (rows.length === 0) {
                throw new Error('No data rows were found in this file.')
            }

            const detectedType = detectDataType(rows)

            if (!detectedType) {
                throw new Error(
                    'Could not identify this dataset. Use Asset, Vulnerability, Control or Insider Threat fields.',
                )
            }

            const uploaded: UploadedFile = {
                file,
                type: detectedType,
                rows,
            }

            setActiveType(detectedType)
            setUploadedFiles((current) => [
                ...current.filter((item) => item.type !== detectedType),
                uploaded,
            ])
        } catch (err) {
            console.error('File import error:', err)
            setError(
                err instanceof Error
                    ? err.message
                    : 'Could not read the file.',
            )
        }
    }

    function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]

        if (file) {
            void handleFile(file)
        }

        event.target.value = ''
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault()

        if (processing) return

        const file = event.dataTransfer.files?.[0]

        if (file) {
            void handleFile(file)
        }
    }

    function removeFile(type: DataType) {
        setUploadedFiles((current) =>
            current.filter((item) => item.type !== type),
        )
        setValidationErrors([])
        setError('')
    }

    function openFilePicker() {
        inputRef.current?.click()
    }

    async function importData() {
        if (uploadedFiles.length === 0) {
            setError('Upload at least one dataset before importing.')
            return
        }

        if (allLocalErrors.length > 0) {
            setValidationErrors(allLocalErrors.slice(0, 20))
            setError(
                `Please fix ${allLocalErrors.length} validation issue${allLocalErrors.length === 1 ? '' : 's'
                } before importing.`,
            )
            return
        }

        setProcessing(true)
        setCompleted(false)
        setError('')
        setValidationErrors([])

        try {
            setProcessingStep('reading')
            await new Promise((resolve) => setTimeout(resolve, 150))

            setProcessingStep('normalizing')
            const company = buildCompanyPayload(uploadedFiles)
            const insider = buildInsiderPayload(uploadedFiles)
            await new Promise((resolve) => setTimeout(resolve, 150))

            setProcessingStep('validating')

            const relationshipIssues = validateRelationships(company)

            if (relationshipIssues.length > 0) {
                setValidationErrors(relationshipIssues)
                setError('The uploaded datasets have relationship errors.')
                return
            }

            await new Promise((resolve) => setTimeout(resolve, 150))
            setProcessingStep('saving')

            let companyImported: ImportStats = {
                assets: 0,
                vulnerabilities: 0,
                controls: 0,
                insiderThreatEvents: 0,
            }

            if (
                company.assets.length > 0 ||
                company.vulnerabilities.length > 0 ||
                company.controls.length > 0
            ) {
                const result = await apiFetch<{
                    success: boolean
                    message?: string
                    error?: unknown
                    imported?: {
                        assets: number
                        vulnerabilities: number
                        controls: number
                        total: number
                    }
                }>('/api/import', {
                    method: 'POST',
                    body: JSON.stringify(company),
                })

                if (!result.success) {
                    throw new Error(
                        result.message ||
                        'The backend could not complete the company data import.',
                    )
                }

                companyImported = {
                    ...companyImported,
                    ...result.imported,
                }
            }

            if (insider.length > 0) {
                const result = await apiFetch<{
                    success: boolean
                    message?: string
                    error?: unknown
                    imported?: {
                        insiderThreatEvents: number
                        total: number
                    }
                }>('/api/import/insider-threat', {
                    method: 'POST',
                    body: JSON.stringify(insider),
                })

                if (!result.success) {
                    throw new Error(
                        result.message ||
                        'The backend could not complete the insider threat import.',
                    )
                }

                companyImported.insiderThreatEvents =
                    result.imported?.insiderThreatEvents ?? insider.length
            }

            setImportStats(companyImported)

            if (
                company.assets.length > 0 ||
                company.vulnerabilities.length > 0 ||
                company.controls.length > 0
            ) {
                setProcessingStep('risk')

                try {
                    await apiFetch('/api/risk')
                } catch (riskError) {
                    console.warn(
                        'Risk refresh failed after import:',
                        riskError,
                    )
                }
            }

            setProcessingStep('done')
            await new Promise((resolve) => setTimeout(resolve, 350))

            localStorage.setItem(IMPORT_STORAGE_KEY, 'true')
            setCompleted(true)
        } catch (err) {
            console.error('Import failed:', err)

            setError(
                err instanceof Error
                    ? err.message
                    : 'Import failed. Please try again.',
            )
        } finally {
            setProcessing(false)
        }
    }

    if (processing) {
        return (
            <div
                className="min-h-screen px-5 py-10"
                style={{ background: 'var(--bg-base)' }}
            >
                <div className="mx-auto flex min-h-[80vh] max-w-xl items-center">
                    <div className="w-full">
                        <div className="text-center">
                            <div
                                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border"
                                style={{
                                    borderColor: 'var(--border-hairline)',
                                    background: 'var(--bg-surface)',
                                }}
                            >
                                <Loader2
                                    size={22}
                                    className="animate-spin"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                            </div>

                            <h1
                                className="mt-6 text-2xl font-semibold tracking-tight"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Processing Security Data
                            </h1>

                            <p
                                className="mx-auto mt-2 max-w-md text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Validating your security data and preparing the CyberSpend
                                risk environment.
                            </p>
                        </div>

                        <div
                            className="mt-8 rounded-xl border p-5"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-surface)',
                            }}
                        >
                            <div className="space-y-5">
                                {PROCESSING_STEPS.map((step) => (
                                    <div key={step.id} className="flex gap-3">
                                        <ProcessingIcon
                                            state={stepState(step.id, processingStep)}
                                        />

                                        <div>
                                            <p
                                                className="text-sm font-medium"
                                                style={{
                                                    color:
                                                        stepState(step.id, processingStep) === 'pending'
                                                            ? 'var(--text-tertiary)'
                                                            : 'var(--text-primary)',
                                                }}
                                            >
                                                {step.label}
                                            </p>

                                            <p
                                                className="mt-0.5 text-xs"
                                                style={{ color: 'var(--text-tertiary)' }}
                                            >
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p
                            className="mt-4 text-center text-xs"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            {totalRecords} records are being processed.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (completed) {
        return (
            <div
                className="min-h-screen px-5 py-10"
                style={{ background: 'var(--bg-base)' }}
            >
                <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
                    <div className="w-full text-center">
                        <div
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                            style={{
                                background: 'var(--status-success-bg)',
                                color: 'var(--status-success-text)',
                            }}
                        >
                            <CheckCircle2 size={28} />
                        </div>

                        <p
                            className="mt-6 text-xs font-medium uppercase tracking-widest"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            Import Complete
                        </p>

                        <h1
                            className="mt-2 text-3xl font-semibold tracking-tight"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Security environment ready
                        </h1>

                        <p
                            className="mx-auto mt-3 max-w-md text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Your uploaded data has been validated and imported successfully.
                        </p>

                        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                            <SummaryCard
                                icon={<Server size={17} />}
                                value={importStats.assets}
                                label="Assets"
                            />
                            <SummaryCard
                                icon={<Bug size={17} />}
                                value={importStats.vulnerabilities}
                                label="Vulnerabilities"
                            />
                            <SummaryCard
                                icon={<ShieldCheck size={17} />}
                                value={importStats.controls}
                                label="Controls"
                            />
                            <SummaryCard
                                icon={<UserRoundSearch size={17} />}
                                value={importStats.insiderThreatEvents}
                                label="Insider Events"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="mt-8 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-85"
                            style={{
                                background: 'var(--accent-action)',
                                color: 'var(--text-inverse)',
                            }}
                        >
                            Open Dashboard
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const activeDataset = DATA_TYPES.find(
        (item) => item.value === activeType,
    )

    const activeValidationErrors = activeFile
        ? validateRows(activeRows, activeFile.type)
        : []

    return (
        <div
            className="min-h-screen px-5 py-8 md:px-8 md:py-12"
            style={{ background: 'var(--bg-base)' }}
        >
            <div className="mx-auto max-w-6xl">
                <header className="mb-9">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{
                                background: 'var(--accent-action)',
                                color: 'var(--text-inverse)',
                            }}
                        >
                            <Database size={16} />
                        </div>

                        <span
                            className="text-sm font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            CyberSpend AI
                        </span>
                    </div>

                    <div className="mt-9">
                        <h1
                            className="text-3xl font-semibold tracking-tight md:text-4xl"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Import security data
                        </h1>

                        <p
                            className="mt-2 max-w-2xl text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Upload your organization&apos;s security datasets to unlock the
                            CyberSpend risk analysis platform.
                        </p>
                    </div>
                </header>

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h2
                            className="text-sm font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Security datasets
                        </h2>

                        <span
                            className="text-xs"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            {uploadedFiles.length} / 4 uploaded
                        </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {DATA_TYPES.map((item) => {
                            const selected = activeType === item.value
                            const uploaded = uploadedFiles.some(
                                (file) => file.type === item.value,
                            )

                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                        setActiveType(item.value)
                                        setError('')
                                        setValidationErrors([])
                                    }}
                                    className="rounded-xl border p-4 text-left transition-colors"
                                    style={{
                                        borderColor: selected
                                            ? 'var(--text-primary)'
                                            : 'var(--border-hairline)',
                                        background: 'var(--bg-surface)',
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 gap-3">
                                            <div
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                                style={{
                                                    background: 'var(--bg-surface-raised)',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                <DatasetIcon type={item.value} />
                                            </div>

                                            <div>
                                                <p
                                                    className="text-sm font-medium"
                                                    style={{ color: 'var(--text-primary)' }}
                                                >
                                                    {item.label}
                                                </p>

                                                <p
                                                    className="mt-1 text-xs leading-relaxed"
                                                    style={{ color: 'var(--text-tertiary)' }}
                                                >
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>

                                        {uploaded && (
                                            <div
                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                                                style={{
                                                    background: 'var(--status-success-bg)',
                                                    color: 'var(--status-success-text)',
                                                }}
                                            >
                                                <Check size={12} />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </section>

                <section
                    className="mt-5 rounded-xl border p-5 md:p-6"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                    }}
                >
                    <div className="mb-4">
                        <h2
                            className="text-xl font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {activeDataset?.label}
                        </h2>

                        <p
                            className="mt-1 text-sm"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            CSV and JSON files are supported. Dataset type is detected
                            automatically from its fields.
                        </p>

                        {activeType === 'insiderThreat' && (
                            <div
                                className="mt-3 rounded-lg border px-3 py-2.5 text-xs"
                                style={{
                                    borderColor: 'var(--border-hairline-soft)',
                                    background: 'var(--bg-base)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Insider Threat CSV files do not need an ID column. CyberSpend
                                generates record IDs automatically.
                            </div>
                        )}
                    </div>

                    <div
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleDrop}
                        onClick={activeFile ? undefined : openFilePicker}
                        className="rounded-xl border border-dashed p-8 text-center md:p-12"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-base)',
                            cursor: activeFile ? 'default' : 'pointer',
                        }}
                    >
                        {activeFile ? (
                            <div className="mx-auto max-w-md">
                                <div
                                    className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg"
                                    style={{
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <FileIcon fileName={activeFile.file.name} />
                                </div>

                                <p
                                    className="mt-4 text-sm font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {activeFile.file.name}
                                </p>

                                <p
                                    className="mt-1 text-xs"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    {activeRows.length} records detected
                                </p>

                                {activeValidationErrors.length > 0 && (
                                    <p
                                        className="mt-2 text-xs font-medium"
                                        style={{ color: 'var(--status-danger-text)' }}
                                    >
                                        {activeValidationErrors.length} validation issue
                                        {activeValidationErrors.length === 1 ? '' : 's'}
                                    </p>
                                )}

                                <div className="mt-5 flex justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            openFilePicker()
                                        }}
                                        className="rounded-md border px-3 py-2 text-xs font-medium"
                                        style={{
                                            borderColor: 'var(--border-hairline)',
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        Replace file
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            removeFile(activeType)
                                        }}
                                        className="rounded-md border px-3 py-2 text-xs font-medium"
                                        style={{
                                            borderColor: 'var(--border-hairline)',
                                            background: 'var(--bg-surface)',
                                            color: 'var(--status-danger-text)',
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg"
                                    style={{
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    <Upload size={20} />
                                </div>

                                <p
                                    className="mt-4 text-sm font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    Drop your file here
                                </p>

                                <p
                                    className="mt-1 text-xs"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    or click to browse from your computer
                                </p>

                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        openFilePicker()
                                    }}
                                    className="mt-5 rounded-md border px-4 py-2 text-xs font-medium"
                                    style={{
                                        borderColor: 'var(--border-hairline)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    Choose file
                                </button>
                            </>
                        )}
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,.json,text/csv,application/json"
                        className="hidden"
                        onChange={handleFileInput}
                    />
                </section>

                {activeFile && activeRows.length > 0 && (
                    <section
                        className="mt-5 rounded-xl border"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                        }}
                    >
                        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border-hairline-soft)' }}>
                            <h2
                                className="text-sm font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Data preview
                            </h2>
                            <p
                                className="mt-0.5 text-xs"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Showing the first 5 records.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead>
                                    <tr className="border-b" style={{ borderColor: 'var(--border-hairline-soft)' }}>
                                        {Object.keys(activeFile.rows[0]).map((key) => (
                                            <th
                                                key={key}
                                                className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold"
                                                style={{ color: 'var(--text-tertiary)' }}
                                            >
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {activeFile.rows.slice(0, 5).map((row, index) => (
                                        <tr
                                            key={index}
                                            className="border-b last:border-b-0"
                                            style={{ borderColor: 'var(--border-hairline-soft)' }}
                                        >
                                            {Object.keys(activeFile.rows[0]).map((key) => (
                                                <td
                                                    key={key}
                                                    className="max-w-65 whitespace-nowrap px-4 py-3 text-xs"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    {String(row[key] ?? '')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {(error || validationErrors.length > 0) && (
                    <section
                        className="mt-5 rounded-xl border p-4"
                        style={{
                            borderColor: 'var(--status-danger-text)',
                            background: 'var(--status-danger-bg)',
                        }}
                    >
                        {error && (
                            <div className="flex gap-2">
                                <AlertCircle
                                    size={16}
                                    className="mt-0.5 shrink-0"
                                    style={{ color: 'var(--status-danger-text)' }}
                                />
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: 'var(--status-danger-text)' }}
                                >
                                    {error}
                                </p>
                            </div>
                        )}

                        {validationErrors.length > 0 && (
                            <div className="mt-3 space-y-1.5 pl-6">
                                {validationErrors.map((message, index) => (
                                    <p
                                        key={`${message}-${index}`}
                                        className="text-xs"
                                        style={{ color: 'var(--status-danger-text)' }}
                                    >
                                        {message}
                                    </p>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {uploadedFiles.length > 0 && (
                    <section
                        className="mt-5 rounded-xl border p-5"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                        }}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2
                                    className="text-sm font-semibold"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    Ready for import
                                </h2>

                                <p
                                    className="mt-0.5 text-xs"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Review the datasets before starting the analysis.
                                </p>
                            </div>

                            <span
                                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                                style={{
                                    background: 'var(--bg-surface-raised)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                {totalRecords} records
                            </span>
                        </div>

                        <div className="mt-4 space-y-2">
                            {uploadedFiles.map((item) => (
                                <div
                                    key={item.type}
                                    className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
                                    style={{ borderColor: 'var(--border-hairline-soft)' }}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                                            style={{
                                                background: 'var(--bg-surface-raised)',
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            <FileIcon fileName={item.file.name} />
                                        </div>

                                        <div className="min-w-0">
                                            <p
                                                className="truncate text-sm font-medium"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {item.file.name}
                                            </p>

                                            <p
                                                className="mt-0.5 text-[11px]"
                                                style={{ color: 'var(--text-tertiary)' }}
                                            >
                                                {item.rows.length} records
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-3">
                                        <span
                                            className="hidden text-xs sm:block"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {DATA_TYPES.find((type) => type.value === item.type)?.label}
                                        </span>

                                        <CheckCircle2
                                            size={16}
                                            style={{ color: 'var(--status-success-text)' }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeFile(item.type)}
                                            aria-label={`Remove ${item.file.name}`}
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="mt-6 flex flex-col items-end gap-2 pb-8">
                    <button
                        type="button"
                        onClick={() => void importData()}
                        disabled={
                            processing ||
                            uploadedFiles.length === 0 ||
                            allLocalErrors.length > 0
                        }
                        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                            background: 'var(--accent-action)',
                            color: 'var(--text-inverse)',
                        }}
                    >
                        Import and analyze
                        <ArrowRight size={16} />
                    </button>

                    <p
                        className="text-[11px]"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        Data is validated before the database import.
                    </p>
                </div>
            </div>
        </div>
    )
}
