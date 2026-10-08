export type DatasetType =
    | 'assets'
    | 'vulnerabilities'
    | 'controls'
    | 'insiderThreat'
    | 'generic'

export interface RawImportRow {
    [key: string]: unknown
}

export interface NormalizedAsset {
    id: string
    name: string
    category: string
    value: number
    criticality:
    | 'Low'
    | 'Medium'
    | 'High'
    | 'Critical'
    internetExposed: boolean
}

export interface NormalizedVulnerability {
    id: string
    assetId: string
    name: string
    cvss: number
    exploitAvailable: boolean
    controlEffectiveness: number
    discoveredOn: Date
}

export interface NormalizedControl {
    id: string
    name: string
    category: string
    cost: number
    riskReductionPct: number
}

export interface NormalizedInsiderThreat {
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

export interface NormalizedGenericDataset {
    filename: string
    format: 'csv' | 'json'
    columns: string[]
    rows: RawImportRow[]
}

export interface NormalizedImportData {
    assets: NormalizedAsset[]
    vulnerabilities: NormalizedVulnerability[]
    controls: NormalizedControl[]
    insiderThreat: NormalizedInsiderThreat[]
    generic: NormalizedGenericDataset[]
}

export interface ImportError {
    field: string
    message: string
    row?: number
    value?: unknown
}

export interface ImportStats {
    assets: number
    vulnerabilities: number
    controls: number
    insiderThreat: number
    generic: number
    total: number
}

export interface ImportResult {
    success: boolean
    stats: ImportStats
    errors: ImportError[]
}

export interface DatasetDetectionResult {
    type: DatasetType | null
    confidence: number
    matchedFields: string[]
}

export interface ImportRequestPayload {
    assets?: RawImportRow[]
    vulnerabilities?: RawImportRow[]
    controls?: RawImportRow[]
    insiderThreat?: RawImportRow[]
    insiderThreatEvents?: RawImportRow[]
    generic?: RawImportRow[]
    data?: RawImportRow[]
    rows?: RawImportRow[]
    records?: RawImportRow[]
    items?: RawImportRow[]
}

export interface ImportServiceInput {
    assets?: RawImportRow[]
    vulnerabilities?: RawImportRow[]
    controls?: RawImportRow[]
    insiderThreat?: RawImportRow[]
    insiderThreatEvents?: RawImportRow[]
    generic?: NormalizedGenericDataset[]
}