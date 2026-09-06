import { useEffect, useMemo, useState } from 'react'
import {
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react'

import {
    getComplianceMappings,
} from '../api/compliance'

import type {
    ComplianceMapping,
} from '../api/compliance'

const FRAMEWORKS = [
    'ISO 27001',
    'NIST CSF',
    'CIS Controls',
    'RBI',
    'SEBI',
]

function getCoverageStyle(coverage: number) {
    if (coverage >= 80) {
        return {
            color: 'var(--risk-safe)',
            background: 'var(--status-success-bg)',
        }
    }

    if (coverage >= 50) {
        return {
            color: 'var(--risk-medium)',
            background: 'var(--status-warning-bg)',
        }
    }

    return {
        color: 'var(--risk-critical)',
        background: 'var(--status-danger-bg)',
    }
}

export default function Compliance() {
    const [mappings, setMappings] = useState<
        ComplianceMapping[]
    >([])

    const [framework, setFramework] =
        useState('ISO 27001')

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    async function loadCompliance() {
        try {
            setLoading(true)
            setError('')

            const data = await getComplianceMappings()

            setMappings(data)
        } catch (err) {
            console.error(err)

            setError(
                'Failed to load compliance mappings. Please try again.',
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCompliance()
    }, [])

    const frameworkRows = useMemo(() => {
        return mappings.map((item) => {
            const clauses =
                item.frameworks[framework] ?? []

            return {
                ...item,
                clauses,
                covered: clauses.length > 0,
            }
        })
    }, [mappings, framework])

    const coveredCount = frameworkRows.filter(
        (item) => item.covered,
    ).length

    const gapCount =
        frameworkRows.length - coveredCount

    const coverage =
        frameworkRows.length > 0
            ? (coveredCount / frameworkRows.length) * 100
            : 0

    const coverageStyle =
        getCoverageStyle(coverage)

    return (
        <div
            className="min-h-screen"
            style={{
                background: 'var(--bg-base)',
            }}
        >
            <div className="mx-auto w-full max-w-7xl px-6 py-7 lg:px-8">
                {/* Header */}
                <header>
                    <div className="flex items-center gap-2.5">
                        <ShieldCheck
                            size={20}
                            strokeWidth={2}
                            style={{
                                color: 'var(--text-primary)',
                            }}
                        />

                        <h1
                            className="text-2xl font-extrabold tracking-tight"
                            style={{
                                color: 'var(--text-primary)',
                            }}
                        >
                            Compliance Mapping
                        </h1>
                    </div>

                    <p
                        className="mt-1 text-sm"
                        style={{
                            color: 'var(--text-secondary)',
                        }}
                    >
                        Map implemented security controls to major
                        cybersecurity frameworks.
                    </p>
                </header>

                {/* Framework selector */}
                <section
                    className="mt-6 border-2"
                    style={{
                        borderColor: 'var(--border-strong)',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                    }}
                >
                    <div className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <label
                                htmlFor="compliance-framework"
                                className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide"
                                style={{
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Compliance Framework
                            </label>

                            <select
                                id="compliance-framework"
                                value={framework}
                                onChange={(event) =>
                                    setFramework(event.target.value)
                                }
                                className="min-w-60 border-2 px-3 py-2.5 text-[13px] outline-none"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                }}
                            >
                                {FRAMEWORKS.map((item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div
                            className="text-[11px]"
                            style={{
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            Showing mappings for{' '}
                            <span
                                className="font-bold"
                                style={{
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                {framework}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Loading */}
                {loading && (
                    <>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {Array.from({ length: 3 }).map(
                                (_, index) => (
                                    <div
                                        key={index}
                                        className="h-28 animate-pulse rounded-md border-2"
                                        style={{
                                            borderColor:
                                                'var(--border-hairline)',
                                            background:
                                                'var(--bg-surface)',
                                        }}
                                    />
                                ),
                            )}
                        </div>

                        <div
                            className="mt-6 h-72 animate-pulse rounded-md border-2"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-surface)',
                            }}
                        />
                    </>
                )}

                {/* Error */}
                {!loading && error && (
                    <div
                        className="mt-6 border-2 p-5"
                        style={{
                            borderColor: '#FECACA',
                            background: 'var(--status-danger-bg)',
                            borderRadius: 'var(--radius-md)',
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle
                                size={17}
                                style={{
                                    color: 'var(--status-danger-text)',
                                }}
                            />

                            <div>
                                <p
                                    className="text-[13px] font-bold"
                                    style={{
                                        color: 'var(--status-danger-text)',
                                    }}
                                >
                                    Unable to load compliance data
                                </p>

                                <p
                                    className="mt-1 text-[12px]"
                                    style={{
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={loadCompliance}
                                    className="mt-4 inline-flex items-center gap-2 border-2 px-3 py-2 text-[12px] font-bold uppercase tracking-wide"
                                    style={{
                                        borderColor: '#FECACA',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}
                                >
                                    <RefreshCw size={13} />
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                {!loading && !error && (
                    <>
                        {/* Summary */}
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {/* Coverage */}
                            <div
                                className="border-2 p-4"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-surface)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <p
                                        className="text-[12px] font-bold uppercase tracking-wide"
                                        style={{
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        Framework Coverage
                                    </p>

                                    <span
                                        className="rounded-full px-2 py-1 text-[10px] font-bold"
                                        style={{
                                            background:
                                                coverageStyle.background,
                                            color: coverageStyle.color,
                                        }}
                                    >
                                        {coverage >= 80
                                            ? 'Strong'
                                            : coverage >= 50
                                                ? 'Partial'
                                                : 'Low'}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-end gap-2">
                                    <span
                                        className="font-data text-4xl font-bold leading-none"
                                        style={{
                                            color: coverageStyle.color,
                                        }}
                                    >
                                        {coverage.toFixed(0)}%
                                    </span>
                                </div>

                                <div
                                    className="mt-4 h-1.5 overflow-hidden rounded-full"
                                    style={{
                                        background:
                                            'var(--bg-surface-raised)',
                                    }}
                                >
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${Math.min(
                                                Math.max(coverage, 0),
                                                100,
                                            )}%`,
                                            background:
                                                coverageStyle.color,
                                        }}
                                    />
                                </div>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color: 'var(--text-tertiary)',
                                    }}
                                >
                                    {coveredCount} of{' '}
                                    {frameworkRows.length} controls
                                    mapped
                                </p>
                            </div>

                            {/* Covered */}
                            <div
                                className="border-2 p-4"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-surface)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2
                                            size={15}
                                            style={{
                                                color: 'var(--risk-safe)',
                                            }}
                                        />

                                        <p
                                            className="text-[12px] font-bold uppercase tracking-wide"
                                            style={{
                                                color:
                                                    'var(--text-secondary)',
                                            }}
                                        >
                                            Covered Controls
                                        </p>
                                    </div>

                                    <span
                                        className="font-data text-[11px] font-semibold"
                                        style={{
                                            color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        {frameworkRows.length > 0
                                            ? `${(
                                                (coveredCount /
                                                    frameworkRows.length) *
                                                100
                                            ).toFixed(0)}%`
                                            : '0%'}
                                    </span>
                                </div>

                                <p
                                    className="font-data mt-4 text-4xl font-bold leading-none"
                                    style={{
                                        color: 'var(--risk-safe)',
                                    }}
                                >
                                    {coveredCount}
                                </p>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color: 'var(--text-tertiary)',
                                    }}
                                >
                                    Controls with a framework mapping
                                </p>
                            </div>

                            {/* Gaps */}
                            <div
                                className="border-2 p-4"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-surface)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle
                                            size={15}
                                            style={{
                                                color: 'var(--risk-high)',
                                            }}
                                        />

                                        <p
                                            className="text-[12px] font-bold uppercase tracking-wide"
                                            style={{
                                                color:
                                                    'var(--text-secondary)',
                                            }}
                                        >
                                            Mapping Gaps
                                        </p>
                                    </div>

                                    <span
                                        className="rounded-full px-2 py-1 text-[10px] font-bold"
                                        style={{
                                            background:
                                                gapCount > 0
                                                    ? 'var(--status-warning-bg)'
                                                    : 'var(--status-success-bg)',
                                            color:
                                                gapCount > 0
                                                    ? 'var(--status-warning-text)'
                                                    : 'var(--status-success-text)',
                                        }}
                                    >
                                        {gapCount > 0
                                            ? 'Needs attention'
                                            : 'Complete'}
                                    </span>
                                </div>

                                <p
                                    className="font-data mt-4 text-4xl font-bold leading-none"
                                    style={{
                                        color:
                                            gapCount > 0
                                                ? 'var(--risk-high)'
                                                : 'var(--risk-safe)',
                                    }}
                                >
                                    {gapCount}
                                </p>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color: 'var(--text-tertiary)',
                                    }}
                                >
                                    Controls without a framework mapping
                                </p>
                            </div>
                        </div>

                        {/* Mapping table */}
                        <section
                            className="mt-6 overflow-hidden border-2"
                            style={{
                                borderColor: 'var(--border-strong)',
                                background: 'var(--bg-surface)',
                                borderRadius: 'var(--radius-md)',
                            }}
                        >
                            <div
                                className="flex flex-col gap-1 border-b-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                }}
                            >
                                <div>
                                    <h2
                                        className="text-base font-bold"
                                        style={{
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        Control Mapping
                                    </h2>

                                    <p
                                        className="mt-0.5 text-[11px]"
                                        style={{
                                            color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        Security controls mapped against{' '}
                                        {framework}.
                                    </p>
                                </div>

                                <span
                                    className="font-data text-[11px] font-semibold"
                                    style={{
                                        color: 'var(--text-tertiary)',
                                    }}
                                >
                                    {frameworkRows.length} controls
                                </span>
                            </div>

                            {frameworkRows.length === 0 ? (
                                <div className="px-6 py-14 text-center">
                                    <div
                                        className="mx-auto flex h-10 w-10 items-center justify-center border-2"
                                        style={{
                                            borderColor:
                                                'var(--border-strong)',
                                            background: 'var(--bg-base)',
                                            color: 'var(--text-tertiary)',
                                            borderRadius: 'var(--radius-sm)',
                                        }}
                                    >
                                        <ShieldCheck size={17} />
                                    </div>

                                    <h3
                                        className="mt-3 text-sm font-semibold"
                                        style={{
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        No security controls found
                                    </h3>

                                    <p
                                        className="mt-1 text-[12px]"
                                        style={{
                                            color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        Add security controls to generate
                                        compliance mappings.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-200 text-left">
                                        <thead
                                            className="border-b-2"
                                            style={{
                                                borderColor:
                                                    'var(--border-strong)',
                                                background: 'var(--bg-base)',
                                            }}
                                        >
                                            <tr>
                                                <th
                                                    className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                                    style={{
                                                        color:
                                                            'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Security Control
                                                </th>

                                                <th
                                                    className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                                    style={{
                                                        color:
                                                            'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Framework Reference
                                                </th>

                                                <th
                                                    className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                                    style={{
                                                        color:
                                                            'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {frameworkRows.map((item) => (
                                                <tr
                                                    key={item.control}
                                                    className="border-b last:border-0 transition-colors duration-100"
                                                    style={{
                                                        borderColor:
                                                            'var(--border-hairline)',
                                                    }}
                                                    onMouseEnter={(event) => {
                                                        event.currentTarget.style.background =
                                                            'var(--bg-surface-hover)'
                                                    }}
                                                    onMouseLeave={(event) => {
                                                        event.currentTarget.style.background =
                                                            'transparent'
                                                    }}
                                                >
                                                    <td className="px-5 py-4 align-top">
                                                        <div
                                                            className="text-[13px] font-semibold"
                                                            style={{
                                                                color:
                                                                    'var(--text-primary)',
                                                            }}
                                                        >
                                                            {item.control}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4 align-top">
                                                        {item.covered ? (
                                                            <div className="space-y-1.5">
                                                                {item.clauses.map(
                                                                    (clause) => (
                                                                        <div
                                                                            key={clause}
                                                                            className="flex items-start gap-2"
                                                                        >
                                                                            <span
                                                                                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                                                                style={{
                                                                                    background:
                                                                                        'var(--text-tertiary)',
                                                                                }}
                                                                            />

                                                                            <span
                                                                                className="text-[12px]"
                                                                                style={{
                                                                                    color:
                                                                                        'var(--text-secondary)',
                                                                                }}
                                                                            >
                                                                                {clause}
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className="text-[12px]"
                                                                style={{
                                                                    color:
                                                                        'var(--text-tertiary)',
                                                                }}
                                                            >
                                                                No mapping available
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 align-top">
                                                        {item.covered ? (
                                                            <span
                                                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                                                                style={{
                                                                    background:
                                                                        'var(--status-success-bg)',
                                                                    color:
                                                                        'var(--status-success-text)',
                                                                }}
                                                            >
                                                                <CheckCircle2
                                                                    size={11}
                                                                />
                                                                Covered
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                                                                style={{
                                                                    background:
                                                                        'var(--status-warning-bg)',
                                                                    color:
                                                                        'var(--status-warning-text)',
                                                                }}
                                                            >
                                                                <AlertTriangle
                                                                    size={11}
                                                                />
                                                                Gap
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    )
}