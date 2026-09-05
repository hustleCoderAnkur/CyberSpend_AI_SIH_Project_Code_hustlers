import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Upload,
    FileJson,
    FileSpreadsheet,
    CheckCircle2,
    AlertTriangle,
    Database,
    ShieldCheck,
    Bug,
    Server,
    ArrowRight,
    Loader2,
    X,
} from 'lucide-react'
import { apiFetch } from '../api/client'
import { parseDataFile } from '../lib/dataParser'

type DataType = 'assets' | 'vulnerabilities' | 'controls'

type NormalizedAsset = {
    id: string
    name: string
    category: string
    value: number
    criticality: 'Low' | 'Medium' | 'High' | 'Critical'
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

type NormalizedRow =
    | NormalizedAsset
    | NormalizedVulnerability
    | NormalizedControl

interface UploadedFile {
    file: File
    type: DataType
    rows: Record<string, unknown>[]
}

interface ImportStats {
    assets: number
    vulnerabilities: number
    controls: number
}

type ProcessingStep =
    | 'reading'
    | 'normalizing'
    | 'validating'
    | 'saving'
    | 'risk'
    | 'done'

interface BackendValidationError {
    field: string
    message: string
    details?: unknown
}

interface BackendValidationResponse {
    valid: boolean
    totalRows: number
    assets: number
    vulnerabilities: number
    controls: number
    errors: BackendValidationError[]
}

const DATA_TYPES: {
    value: DataType
    label: string
    description: string
}[] = [
        {
            value: 'assets',
            label: 'Asset Inventory',
            description: 'Servers, databases, applications, cloud assets',
        },
        {
            value: 'vulnerabilities',
            label: 'Vulnerability Data',
            description: 'CVEs, scanner findings, security weaknesses',
        },
        {
            value: 'controls',
            label: 'Security Controls',
            description: 'MFA, EDR, WAF, patching and other controls',
        },
    ]

const FIELD_ALIASES: Record<DataType, Record<string, string[]>> = {
    assets: {
        id: ['id', 'asset_id', 'assetid'],
        name: ['name', 'asset_name', 'assetname', 'hostname', 'host'],
        category: ['category', 'type', 'asset_type', 'assettype'],
        value: [
            'value',
            'asset_value',
            'assetvalue',
            'business_value',
            'businessvalue',
        ],
        criticality: [
            'criticality',
            'criticality_level',
            'risk_level',
            'risklevel',
            'severity',
        ],
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
        name: [
            'name',
            'vulnerability',
            'vulnerability_name',
            'vulnerabilityname',
            'finding',
            'title',
        ],
        cvss: ['cvss', 'cvss_score', 'cvssscore', 'cvss_v3'],
        exploitAvailable: [
            'exploitavailable',
            'exploit_available',
            'exploit',
            'exploitability',
        ],
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
}

function normalizeKey(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '')
}

function parseBoolean(value: unknown) {
    if (typeof value === 'boolean') return value

    const normalized = String(value ?? '')
        .trim()
        .toLowerCase()

    return ['true', 'yes', 'y', '1'].includes(normalized)
}

function parseNumber(value: unknown) {
    if (typeof value === 'number') return value

    const cleaned = String(value ?? '')
        .replace(/₹/g, '')
        .replace(/,/g, '')
        .replace(/%/g, '')
        .trim()

    const number = Number(cleaned)

    return Number.isFinite(number) ? number : NaN
}

function findField(
    row: Record<string, unknown>,
    type: DataType,
    field: string,
) {
    const aliases = FIELD_ALIASES[type][field] ?? []

    const normalizedEntries = Object.entries(row).map(
        ([key, value]) => ({
            key: normalizeKey(key),
            value,
        }),
    )

    const match = normalizedEntries.find(({ key }) =>
        aliases.some((alias) => normalizeKey(alias) === key),
    )

    return match?.value
}

function generateId(prefix: string) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function normalizeCriticality(
    value: unknown,
): 'Low' | 'Medium' | 'High' | 'Critical' | null {
    const normalized = String(value ?? '')
        .trim()
        .toLowerCase()

    if (normalized === 'critical') return 'Critical'
    if (normalized === 'high') return 'High'
    if (normalized === 'medium') return 'Medium'
    if (normalized === 'low') return 'Low'

    return null
}

function normalizeDate(value: unknown) {
    if (!value) return new Date().toISOString()

    const date = new Date(String(value))

    return Number.isNaN(date.getTime())
        ? new Date().toISOString()
        : date.toISOString()
}

function normalizeRows(
    rows: Record<string, unknown>[],
    type: DataType,
): NormalizedRow[] {
    if (type === 'assets') {
        return rows.map((row) => ({
            id: String(findField(row, type, 'id') || generateId('A')),
            name: String(findField(row, type, 'name') || '').trim(),
            category: String(
                findField(row, type, 'category') || 'Other',
            ).trim(),
            value: parseNumber(findField(row, type, 'value')),
            criticality:
                normalizeCriticality(
                    findField(row, type, 'criticality'),
                ) ?? 'Medium',
            internetExposed: parseBoolean(
                findField(row, type, 'internetExposed'),
            ),
        }))
    }

    if (type === 'vulnerabilities') {
        return rows.map((row) => {
            let controlEffectiveness = parseNumber(
                findField(row, type, 'controlEffectiveness'),
            )

            if (Number.isNaN(controlEffectiveness)) {
                controlEffectiveness = 0
            }

            if (controlEffectiveness > 1) {
                controlEffectiveness /= 100
            }

            return {
                id: String(
                    findField(row, type, 'id') || generateId('V'),
                ),
                assetId: String(
                    findField(row, type, 'assetId') || '',
                ).trim(),
                name: String(
                    findField(row, type, 'name') || '',
                ).trim(),
                cvss: parseNumber(
                    findField(row, type, 'cvss'),
                ),
                exploitAvailable: parseBoolean(
                    findField(row, type, 'exploitAvailable'),
                ),
                controlEffectiveness,
                discoveredOn: normalizeDate(
                    findField(row, type, 'discoveredOn'),
                ),
            }
        })
    }

    return rows.map((row) => {
        let riskReductionPct = parseNumber(
            findField(row, type, 'riskReductionPct'),
        )

        if (Number.isNaN(riskReductionPct)) {
            riskReductionPct = 0
        }

        if (riskReductionPct > 1) {
            riskReductionPct /= 100
        }

        return {
            id: String(
                findField(row, type, 'id') || generateId('C'),
            ),
            name: String(
                findField(row, type, 'name') || '',
            ).trim(),
            category: String(
                findField(row, type, 'category') || 'Other',
            ).trim(),
            cost: parseNumber(
                findField(row, type, 'cost'),
            ),
            riskReductionPct,
        }
    })
}

function validateRows(
    rows: NormalizedRow[],
    type: DataType,
) {
    const errors: string[] = []
    const ids = new Set<string>()

    rows.forEach((row, index) => {
        const rowNumber = index + 2

        // Common ID validation
        if (!row.id) {
            errors.push(
                `${type} row ${rowNumber}: ID is missing.`,
            )
        } else if (ids.has(row.id)) {
            errors.push(
                `${type} row ${rowNumber}: duplicate ID "${row.id}".`,
            )
        } else {
            ids.add(row.id)
        }

        // Assets
        if (type === 'assets') {
            const asset = row as NormalizedAsset

            if (!asset.name.trim()) {
                errors.push(
                    `Asset row ${rowNumber}: name is missing.`,
                )
            }

            if (!asset.category.trim()) {
                errors.push(
                    `Asset row ${rowNumber}: category is missing.`,
                )
            }

            if (
                ![
                    'Low',
                    'Medium',
                    'High',
                    'Critical',
                ].includes(asset.criticality)
            ) {
                errors.push(
                    `Asset row ${rowNumber}: criticality must be Low, Medium, High or Critical.`,
                )
            }

            if (
                typeof asset.value !== 'number' ||
                Number.isNaN(asset.value) ||
                !Number.isFinite(asset.value) ||
                asset.value <= 0
            ) {
                errors.push(
                    `Asset row ${rowNumber}: asset value must be a positive number.`,
                )
            }

            if (
                typeof asset.internetExposed !== 'boolean'
            ) {
                errors.push(
                    `Asset row ${rowNumber}: internetExposed must be true or false.`,
                )
            }
        }

        // Vulnerabilities
        if (type === 'vulnerabilities') {
            const vulnerability =
                row as NormalizedVulnerability

            if (!vulnerability.assetId.trim()) {
                errors.push(
                    `Vulnerability row ${rowNumber}: assetId is missing.`,
                )
            }

            if (!vulnerability.name.trim()) {
                errors.push(
                    `Vulnerability row ${rowNumber}: name is missing.`,
                )
            }

            if (
                typeof vulnerability.cvss !== 'number' ||
                Number.isNaN(vulnerability.cvss) ||
                !Number.isFinite(vulnerability.cvss) ||
                vulnerability.cvss < 0 ||
                vulnerability.cvss > 10
            ) {
                errors.push(
                    `Vulnerability row ${rowNumber}: CVSS must be between 0 and 10.`,
                )
            }

            if (
                typeof vulnerability.exploitAvailable !==
                'boolean'
            ) {
                errors.push(
                    `Vulnerability row ${rowNumber}: exploitAvailable must be true or false.`,
                )
            }

            if (
                typeof vulnerability.controlEffectiveness !==
                'number' ||
                Number.isNaN(
                    vulnerability.controlEffectiveness,
                ) ||
                !Number.isFinite(
                    vulnerability.controlEffectiveness,
                ) ||
                vulnerability.controlEffectiveness < 0 ||
                vulnerability.controlEffectiveness > 1
            ) {
                errors.push(
                    `Vulnerability row ${rowNumber}: control effectiveness must be between 0 and 100%.`,
                )
            }

            if (
                !vulnerability.discoveredOn ||
                Number.isNaN(
                    new Date(
                        vulnerability.discoveredOn,
                    ).getTime(),
                )
            ) {
                errors.push(
                    `Vulnerability row ${rowNumber}: discoveredOn must be a valid date.`,
                )
            }
        }

        // Controls
        if (type === 'controls') {
            const control = row as NormalizedControl

            if (!control.name.trim()) {
                errors.push(
                    `Control row ${rowNumber}: name is missing.`,
                )
            }

            if (!control.category.trim()) {
                errors.push(
                    `Control row ${rowNumber}: category is missing.`,
                )
            }

            if (
                typeof control.cost !== 'number' ||
                Number.isNaN(control.cost) ||
                !Number.isFinite(control.cost) ||
                control.cost <= 0
            ) {
                errors.push(
                    `Control row ${rowNumber}: cost must be positive.`,
                )
            }

            if (
                typeof control.riskReductionPct !==
                'number' ||
                Number.isNaN(
                    control.riskReductionPct,
                ) ||
                !Number.isFinite(
                    control.riskReductionPct,
                ) ||
                control.riskReductionPct < 0 ||
                control.riskReductionPct > 1
            ) {
                errors.push(
                    `Control row ${rowNumber}: risk reduction must be between 0 and 100%.`,
                )
            }
        }
    })

    return errors
}

function buildImportPayload(uploadedFiles: UploadedFile[]) {
    const payload: {
        assets: NormalizedAsset[]
        vulnerabilities: NormalizedVulnerability[]
        controls: NormalizedControl[]
    } = {
        assets: [],
        vulnerabilities: [],
        controls: [],
    }

    for (const item of uploadedFiles) {
        const rows = normalizeRows(item.rows, item.type)

        if (item.type === 'assets') {
            payload.assets.push(...(rows as NormalizedAsset[]))
        }

        if (item.type === 'vulnerabilities') {
            payload.vulnerabilities.push(
                ...(rows as NormalizedVulnerability[]),
            )
        }

        if (item.type === 'controls') {
            payload.controls.push(...(rows as NormalizedControl[]))
        }
    }

    return payload
}

function formatStepState(
    step: ProcessingStep,
    currentStep: ProcessingStep,
) {
    const order: ProcessingStep[] = [
        'reading',
        'normalizing',
        'validating',
        'saving',
        'risk',
        'done',
    ]

    const currentIndex = order.indexOf(currentStep)
    const stepIndex = order.indexOf(step)

    if (stepIndex < currentIndex) return 'complete'
    if (step === currentStep) return 'active'
    return 'pending'
}

const PROCESSING_STEPS: {
    id: ProcessingStep
    label: string
    description: string
}[] = [
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
            description: 'Checking required fields and relationships',
        },
        {
            id: 'saving',
            label: 'Saving data to security database',
            description: 'Writing validated data to Neon PostgreSQL',
        },
        {
            id: 'risk',
            label: 'Calculating cyber risk',
            description: 'Refreshing the financial risk model',
        },
    ]

export default function CompanyDataImport() {
    const navigate = useNavigate()

    const [activeType, setActiveType] =
        useState<DataType>('assets')

    const [uploadedFiles, setUploadedFiles] = useState<
        UploadedFile[]
    >([])

    const [processing, setProcessing] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [processingStep, setProcessingStep] =
        useState<ProcessingStep>('reading')

    const [error, setError] = useState('')
    const [validationErrors, setValidationErrors] =
        useState<string[]>([])

    const [importStats, setImportStats] =
        useState<ImportStats>({
            assets: 0,
            vulnerabilities: 0,
            controls: 0,
        })

    const activeFile = uploadedFiles.find(
        (item) => item.type === activeType,
    )

    const activeRows = useMemo(() => {
        if (!activeFile) return []

        return normalizeRows(
            activeFile.rows,
            activeFile.type,
        )
    }, [activeFile])

    const activeValidationErrors = useMemo(() => {
        if (!activeFile) return []

        return validateRows(
            activeRows,
            activeFile.type,
        )
    }, [activeFile, activeRows])

    const importPayload = useMemo(
        () => buildImportPayload(uploadedFiles),
        [uploadedFiles],
    )

    const totalRecords =
        importPayload.assets.length +
        importPayload.vulnerabilities.length +
        importPayload.controls.length

    async function handleFile(file: File) {
        if (
            !file.name.toLowerCase().endsWith('.csv') &&
            !file.name.toLowerCase().endsWith('.json')
        ) {
            setError('Only CSV and JSON files are supported.')
            return
        }

        try {
            setError('')
            setValidationErrors([])

            const rows = await parseDataFile(
                file,
                activeType,
            )

            if (rows.length === 0) {
                throw new Error(
                    'No data rows were found in this file.',
                )
            }

            const uploaded: UploadedFile = {
                file,
                type: activeType,
                rows,
            }

            setUploadedFiles((current) => [
                ...current.filter(
                    (item) => item.type !== activeType,
                ),
                uploaded,
            ])
        } catch (err) {
            console.error(err)

            setError(
                err instanceof Error
                    ? err.message
                    : 'Could not read the file.',
            )
        }
    }

    function removeFile(type: DataType) {
        setUploadedFiles((current) =>
            current.filter((item) => item.type !== type),
        )

        setValidationErrors([])
        setError('')
    }

    async function validateImportPayload() {
        const localErrors = uploadedFiles.flatMap(
            (item) =>
                validateRows(
                    normalizeRows(item.rows, item.type),
                    item.type,
                ),
        )

        if (localErrors.length > 0) {
            return {
                valid: false,
                errors: localErrors,
            }
        }

        const response =
            await apiFetch<BackendValidationResponse>(
                '/import/validate',
                {
                    method: 'POST',
                    body: JSON.stringify(importPayload),
                },
            )

        if (!response.valid) {
            return {
                valid: false,
                errors: response.errors.map(
                    (item) =>
                        `${item.field}: ${item.message}`,
                ),
            }
        }

        return {
            valid: true,
            errors: [],
        }
    }

    async function importData() {
        if (uploadedFiles.length === 0) {
            setError(
                'Upload at least one asset, vulnerability or control file.',
            )
            return
        }

        setProcessing(true)
        setCompleted(false)
        setError('')
        setValidationErrors([])
        setProcessingStep('reading')

        try {
            /*
             * Step 1: Files have already been parsed by handleFile.
             * Keep this step visible so the user understands the pipeline.
             */
            await new Promise((resolve) =>
                setTimeout(resolve, 250),
            )

            /*
             * Step 2: Normalization is performed when the payload is built.
             */
            setProcessingStep('normalizing')
            const payload = buildImportPayload(uploadedFiles)

            await new Promise((resolve) =>
                setTimeout(resolve, 250),
            )

            /*
             * Step 3: Validate locally and through the backend.
             */
            setProcessingStep('validating')

            const validation = await validateImportPayload()

            if (!validation.valid) {
                const errors = validation.errors

                setValidationErrors(
                    errors.slice(0, 20),
                )

                setError(
                    `Please fix ${errors.length} validation issue${errors.length === 1 ? '' : 's'
                    } before importing.`,
                )

                setProcessing(false)
                return
            }

            /*
             * Step 4: Atomic backend import.
             *
             * The backend transaction inserts assets first,
             * then vulnerabilities, then controls.
             */
            setProcessingStep('saving')

            const result = await apiFetch<{
                success: boolean
                message: string
                imported: ImportStats & {
                    total: number
                }
            }>('/import', {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            if (!result.success) {
                throw new Error(
                    'The backend could not complete the import.',
                )
            }

            setImportStats(result.imported)

            /*
             * Step 5: Risk engine is calculated on demand by the
             * /api/risk endpoint. Calling it here confirms that
             * the newly imported database state is readable.
             */
            setProcessingStep('risk')

            await apiFetch('/risk')

            setProcessingStep('done')

            await new Promise((resolve) =>
                setTimeout(resolve, 500),
            )

            setCompleted(true)
        } catch (err) {
            console.error(err)

            setError(
                err instanceof Error
                    ? err.message
                    : 'Import failed. Please try again.',
            )
        } finally {
            setProcessing(false)
        }
    }

    function handleContinue() {
        navigate('/dashboard')
    }

    function renderProcessingIcon(
        state: 'complete' | 'active' | 'pending',
    ) {
        if (state === 'complete') {
            return (
                <CheckCircle2
                    size={18}
                    className="text-emerald-400"
                />
            )
        }

        if (state === 'active') {
            return (
                <Loader2
                    size={18}
                    className="animate-spin"
                    style={{
                        color: 'var(--accent-action)',
                    }}
                />
            )
        }

        return (
            <div
                className="h-[18px] w-[18px] rounded-full border"
                style={{
                    borderColor:
                        'var(--border-hairline)',
                }}
            />
        )
    }

    if (processing) {
        return (
            <div
                className="flex min-h-screen items-center justify-center p-6"
                style={{
                    background: 'var(--bg-base)',
                }}
            >
                <div className="w-full max-w-xl">
                    <div className="text-center">
                        <div
                            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                            style={{
                                background:
                                    'var(--bg-surface-raised)',
                            }}
                        >
                            <Loader2
                                size={28}
                                className="animate-spin"
                                style={{
                                    color:
                                        'var(--accent-action)',
                                }}
                            />
                        </div>

                        <h1
                            className="mt-6 text-2xl font-semibold"
                            style={{
                                color:
                                    'var(--text-primary)',
                            }}
                        >
                            Processing Security Data
                        </h1>

                        <p
                            className="mx-auto mt-2 max-w-md text-sm"
                            style={{
                                color:
                                    'var(--text-secondary)',
                            }}
                        >
                            CyberSpend AI is importing,
                            validating and calculating
                            your organization's financial
                            cyber risk.
                        </p>
                    </div>

                    <div
                        className="mt-8 rounded-lg border p-5"
                        style={{
                            borderColor:
                                'var(--border-hairline)',
                            background:
                                'var(--bg-surface)',
                        }}
                    >
                        <div className="space-y-5">
                            {PROCESSING_STEPS.map(
                                (step) => {
                                    const state =
                                        formatStepState(
                                            step.id,
                                            processingStep,
                                        )

                                    return (
                                        <div
                                            key={step.id}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="mt-0.5">
                                                {renderProcessingIcon(
                                                    state,
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <p
                                                    className="text-sm font-medium"
                                                    style={{
                                                        color:
                                                            state ===
                                                                'pending'
                                                                ? 'var(--text-tertiary)'
                                                                : 'var(--text-primary)',
                                                    }}
                                                >
                                                    {
                                                        step.label
                                                    }
                                                </p>

                                                <p
                                                    className="mt-0.5 text-xs"
                                                    style={{
                                                        color:
                                                            'var(--text-tertiary)',
                                                    }}
                                                >
                                                    {
                                                        step.description
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )
                                },
                            )}
                        </div>
                    </div>

                    <p
                        className="mt-4 text-center text-xs"
                        style={{
                            color:
                                'var(--text-tertiary)',
                        }}
                    >
                        {totalRecords} records are being
                        processed. Please do not close
                        this page.
                    </p>
                </div>
            </div>
        )
    }

    if (completed) {
        return (
            <div
                className="flex min-h-screen items-center justify-center p-6"
                style={{
                    background: 'var(--bg-base)',
                }}
            >
                <div className="w-full max-w-xl text-center">
                    <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                        style={{
                            background:
                                'var(--bg-surface-raised)',
                        }}
                    >
                        <CheckCircle2
                            size={32}
                            className="text-emerald-400"
                        />
                    </div>

                    <h1
                        className="mt-6 text-2xl font-semibold"
                        style={{
                            color: 'var(--text-primary)',
                        }}
                    >
                        Enterprise Data Imported
                    </h1>

                    <p
                        className="mt-2 text-sm"
                        style={{
                            color:
                                'var(--text-secondary)',
                        }}
                    >
                        Your security environment is
                        ready for financial risk analysis.
                    </p>

                    <div className="mt-8 grid grid-cols-3 gap-3">
                        <div
                            className="rounded-lg border p-4"
                            style={{
                                borderColor:
                                    'var(--border-hairline)',
                                background:
                                    'var(--bg-surface)',
                            }}
                        >
                            <Server
                                size={17}
                                className="mx-auto"
                                style={{
                                    color:
                                        'var(--text-tertiary)',
                                }}
                            />

                            <p
                                className="mt-3 text-2xl font-semibold"
                                style={{
                                    color:
                                        'var(--text-primary)',
                                }}
                            >
                                {importStats.assets}
                            </p>

                            <p
                                className="mt-1 text-xs"
                                style={{
                                    color:
                                        'var(--text-tertiary)',
                                }}
                            >
                                Assets
                            </p>
                        </div>

                        <div
                            className="rounded-lg border p-4"
                            style={{
                                borderColor:
                                    'var(--border-hairline)',
                                background:
                                    'var(--bg-surface)',
                            }}
                        >
                            <Bug
                                size={17}
                                className="mx-auto"
                                style={{
                                    color:
                                        'var(--text-tertiary)',
                                }}
                            />

                            <p
                                className="mt-3 text-2xl font-semibold"
                                style={{
                                    color:
                                        'var(--text-primary)',
                                }}
                            >
                                {
                                    importStats.vulnerabilities
                                }
                            </p>

                            <p
                                className="mt-1 text-xs"
                                style={{
                                    color:
                                        'var(--text-tertiary)',
                                }}
                            >
                                Vulnerabilities
                            </p>
                        </div>

                        <div
                            className="rounded-lg border p-4"
                            style={{
                                borderColor:
                                    'var(--border-hairline)',
                                background:
                                    'var(--bg-surface)',
                            }}
                        >
                            <ShieldCheck
                                size={17}
                                className="mx-auto"
                                style={{
                                    color:
                                        'var(--text-tertiary)',
                                }}
                            />

                            <p
                                className="mt-3 text-2xl font-semibold"
                                style={{
                                    color:
                                        'var(--text-primary)',
                                }}
                            >
                                {importStats.controls}
                            </p>

                            <p
                                className="mt-1 text-xs"
                                style={{
                                    color:
                                        'var(--text-tertiary)',
                                }}
                            >
                                Controls
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleContinue}
                        className="mt-8 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium"
                        style={{
                            background:
                                'var(--accent-action)',
                            color: '#0A0F1C',
                        }}
                    >
                        View Security Dashboard
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            className="min-h-screen p-6 md:p-10"
            style={{
                background: 'var(--bg-base)',
            }}
        >
            <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <div className="flex items-center gap-2">
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-md"
                            style={{
                                background:
                                    'var(--accent-action)',
                            }}
                        >
                            <Database
                                size={17}
                                style={{
                                    color: '#0A0F1C',
                                }}
                            />
                        </div>

                        <span
                            className="text-sm font-medium"
                            style={{
                                color:
                                    'var(--text-secondary)',
                            }}
                        >
                            CyberSpend AI
                        </span>
                    </div>

                    <h1
                        className="mt-8 text-3xl font-semibold tracking-tight"
                        style={{
                            color: 'var(--text-primary)',
                        }}
                    >
                        Enterprise Data Import
                    </h1>

                    <p
                        className="mt-2 max-w-2xl text-sm"
                        style={{
                            color:
                                'var(--text-secondary)',
                        }}
                    >
                        Import your organization's security
                        data to calculate financial cyber
                        risk.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {DATA_TYPES.map((item) => {
                        const selected =
                            activeType === item.value

                        const uploaded =
                            uploadedFiles.some(
                                (file) =>
                                    file.type ===
                                    item.value,
                            )

                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                    setActiveType(
                                        item.value,
                                    )
                                    setError('')
                                    setValidationErrors(
                                        [],
                                    )
                                }}
                                className="rounded-lg border p-4 text-left transition-colors"
                                style={{
                                    borderColor: selected
                                        ? 'var(--accent-action)'
                                        : 'var(--border-hairline)',
                                    background: selected
                                        ? 'var(--bg-surface-raised)'
                                        : 'var(--bg-surface)',
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p
                                            className="text-sm font-medium"
                                            style={{
                                                color:
                                                    'var(--text-primary)',
                                            }}
                                        >
                                            {item.label}
                                        </p>

                                        <p
                                            className="mt-1 text-xs"
                                            style={{
                                                color:
                                                    'var(--text-tertiary)',
                                            }}
                                        >
                                            {
                                                item.description
                                            }
                                        </p>
                                    </div>

                                    {uploaded && (
                                        <CheckCircle2
                                            size={17}
                                            className="text-emerald-400"
                                        />
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div
                    className="mt-5 rounded-lg border p-6"
                    style={{
                        borderColor:
                            'var(--border-hairline)',
                        background:
                            'var(--bg-surface)',
                    }}
                >
                    <div
                        className="rounded-lg border-2 border-dashed p-10 text-center"
                        style={{
                            borderColor:
                                'var(--border-hairline-soft)',
                        }}
                    >
                        {activeFile ? (
                            <>
                                <div
                                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg"
                                    style={{
                                        background:
                                            'var(--bg-surface-raised)',
                                    }}
                                >
                                    {activeFile.file.name
                                        .toLowerCase()
                                        .endsWith(
                                            '.json',
                                        ) ? (
                                        <FileJson
                                            size={22}
                                            style={{
                                                color:
                                                    'var(--accent-action)',
                                            }}
                                        />
                                    ) : (
                                        <FileSpreadsheet
                                            size={22}
                                            style={{
                                                color:
                                                    'var(--accent-action)',
                                            }}
                                        />
                                    )}
                                </div>

                                <p
                                    className="mt-4 text-sm font-medium"
                                    style={{
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    {
                                        activeFile.file
                                            .name
                                    }
                                </p>

                                <p
                                    className="mt-1 text-xs"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    {activeRows.length}{' '}
                                    records detected
                                </p>

                                <div className="mt-4 flex items-center justify-center gap-3">
                                    <label
                                        className="inline-flex cursor-pointer items-center rounded-md px-4 py-2 text-xs font-medium"
                                        style={{
                                            background:
                                                'var(--bg-surface-raised)',
                                            color:
                                                'var(--text-primary)',
                                        }}
                                    >
                                        Replace File

                                        <input
                                            type="file"
                                            accept=".csv,.json"
                                            className="hidden"
                                            onChange={(
                                                event,
                                            ) => {
                                                const file =
                                                    event
                                                        .target
                                                        .files?.[0]

                                                if (file) {
                                                    void handleFile(
                                                        file,
                                                    )
                                                }

                                                event.target.value =
                                                    ''
                                            }}
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeFile(
                                                activeType,
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs text-red-400"
                                    >
                                        <X size={14} />
                                        Remove
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg"
                                    style={{
                                        background:
                                            'var(--bg-surface-raised)',
                                    }}
                                >
                                    <Upload
                                        size={22}
                                        style={{
                                            color:
                                                'var(--text-secondary)',
                                        }}
                                    />
                                </div>

                                <p
                                    className="mt-4 text-sm font-medium"
                                    style={{
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    Drop your file here
                                </p>

                                <p
                                    className="mt-1 text-xs"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    CSV or JSON
                                </p>

                                <label
                                    className="mt-5 inline-flex cursor-pointer items-center rounded-md px-4 py-2 text-xs font-medium"
                                    style={{
                                        background:
                                            'var(--bg-surface-raised)',
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    Browse Files

                                    <input
                                        type="file"
                                        accept=".csv,.json"
                                        className="hidden"
                                        onChange={(
                                            event,
                                        ) => {
                                            const file =
                                                event.target
                                                    .files?.[0]

                                            if (file) {
                                                void handleFile(
                                                    file,
                                                )
                                            }

                                            event.target.value =
                                                ''
                                        }}
                                    />
                                </label>
                            </>
                        )}
                    </div>
                </div>

                {activeFile && (
                    <div
                        className="mt-5 overflow-hidden rounded-lg border"
                        style={{
                            borderColor:
                                'var(--border-hairline)',
                            background:
                                'var(--bg-surface)',
                        }}
                    >
                        <div
                            className="flex items-center justify-between border-b px-5 py-4"
                            style={{
                                borderColor:
                                    'var(--border-hairline)',
                            }}
                        >
                            <div>
                                <h2
                                    className="text-sm font-semibold"
                                    style={{
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    Data Preview
                                </h2>

                                <p
                                    className="mt-1 text-xs"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    First records after
                                    normalization
                                </p>
                            </div>

                            {activeValidationErrors.length ===
                                0 ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                                    <CheckCircle2
                                        size={14}
                                    />
                                    Validation passed
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs text-orange-400">
                                    <AlertTriangle
                                        size={14}
                                    />
                                    Validation issues
                                </span>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr
                                        className="border-b text-xs"
                                        style={{
                                            borderColor:
                                                'var(--border-hairline)',
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    >
                                        {Object.keys(
                                            activeRows[0] ??
                                            {},
                                        ).map(
                                            (key) => (
                                                <th
                                                    key={
                                                        key
                                                    }
                                                    className="px-4 py-3 font-medium"
                                                >
                                                    {key}
                                                </th>
                                            ),
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {activeRows
                                        .slice(0, 5)
                                        .map(
                                            (
                                                row,
                                                index,
                                            ) => {
                                                const entries =
                                                    Object.entries(
                                                        row,
                                                    )

                                                return (
                                                    <tr
                                                        key={
                                                            index
                                                        }
                                                        className="border-b last:border-b-0"
                                                        style={{
                                                            borderColor:
                                                                'var(--border-hairline-soft)',
                                                        }}
                                                    >
                                                        {entries.map(
                                                            ([
                                                                key,
                                                                value,
                                                            ]) => (
                                                                <td
                                                                    key={
                                                                        key
                                                                    }
                                                                    className="whitespace-nowrap px-4 py-3 text-xs"
                                                                    style={{
                                                                        color:
                                                                            'var(--text-secondary)',
                                                                    }}
                                                                >
                                                                    {String(
                                                                        value ??
                                                                        '',
                                                                    )}
                                                                </td>
                                                            ),
                                                        )}
                                                    </tr>
                                                )
                                            },
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(error ||
                    validationErrors.length > 0) && (
                        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                            {error && (
                                <p className="text-sm text-red-400">
                                    {error}
                                </p>
                            )}

                            {validationErrors.length >
                                0 && (
                                    <div className="mt-2 space-y-1">
                                        {validationErrors.map(
                                            (message) => (
                                                <p
                                                    key={message}
                                                    className="text-xs text-red-300"
                                                >
                                                    {message}
                                                </p>
                                            ),
                                        )}
                                    </div>
                                )}
                        </div>
                    )}

                {uploadedFiles.length > 0 && (
                    <div
                        className="mt-5 rounded-lg border p-5"
                        style={{
                            borderColor:
                                'var(--border-hairline)',
                            background:
                                'var(--bg-surface)',
                        }}
                    >
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    className="text-sm font-semibold"
                                    style={{
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    Files Ready for Import
                                </h2>

                                <p
                                    className="mt-1 text-xs"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Upload one or more
                                    datasets before
                                    starting the analysis.
                                </p>
                            </div>

                            <span
                                className="rounded-full px-2.5 py-1 text-[11px]"
                                style={{
                                    background:
                                        'var(--bg-surface-raised)',
                                    color:
                                        'var(--text-secondary)',
                                }}
                            >
                                {totalRecords} total records
                            </span>
                        </div>

                        <div className="space-y-2">
                            {uploadedFiles.map(
                                (item) => (
                                    <div
                                        key={item.type}
                                        className="flex items-center justify-between rounded-md border px-4 py-3"
                                        style={{
                                            borderColor:
                                                'var(--border-hairline-soft)',
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2
                                                size={16}
                                                className="text-emerald-400"
                                            />

                                            <div>
                                                <p
                                                    className="text-sm"
                                                    style={{
                                                        color:
                                                            'var(--text-primary)',
                                                    }}
                                                >
                                                    {
                                                        item
                                                            .file
                                                            .name
                                                    }
                                                </p>

                                                <p
                                                    className="text-[11px]"
                                                    style={{
                                                        color:
                                                            'var(--text-tertiary)',
                                                    }}
                                                >
                                                    {
                                                        item
                                                            .rows
                                                            .length
                                                    }{' '}
                                                    records
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span
                                                className="text-xs"
                                                style={{
                                                    color:
                                                        'var(--text-secondary)',
                                                }}
                                            >
                                                {
                                                    DATA_TYPES.find(
                                                        (
                                                            type,
                                                        ) =>
                                                            type.value ===
                                                            item.type,
                                                    )?.label
                                                }
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeFile(
                                                        item.type,
                                                    )
                                                }
                                                className="text-red-400"
                                                aria-label={`Remove ${item.file.name}`}
                                            >
                                                <X
                                                    size={
                                                        15
                                                    }
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-6 flex flex-col items-end gap-2">
                    <button
                        type="button"
                        onClick={() => void importData()}
                        disabled={
                            processing ||
                            uploadedFiles.length === 0
                        }
                        className="flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                            background:
                                'var(--accent-action)',
                            color: '#0A0F1C',
                        }}
                    >
                        Import Data & Analyze Risk
                        <ArrowRight size={16} />
                    </button>

                    <p
                        className="text-[11px]"
                        style={{
                            color:
                                'var(--text-tertiary)',
                        }}
                    >
                        Data is validated before atomic
                        database import. Risk is recalculated
                        after the import.
                    </p>
                </div>
            </div>
        </div>
    )
}
