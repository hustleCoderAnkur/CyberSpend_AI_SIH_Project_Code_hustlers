import { useEffect, useMemo, useState } from 'react'
import {
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
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

export default function Compliance() {
    const [mappings, setMappings] = useState<ComplianceMapping[]>([])
    const [framework, setFramework] = useState('ISO 27001')

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadCompliance() {
            try {
                setLoading(true)
                setError('')

                const data = await getComplianceMappings()

                setMappings(data)
            } catch (err) {
                console.error(err)
                setError('Failed to load compliance mappings.')
            } finally {
                setLoading(false)
            }
        }

        loadCompliance()
    }, [])

    const frameworkRows = useMemo(() => {
        return mappings.map((item) => {
            const clauses = item.frameworks[framework] ?? []

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

    const gapCount = frameworkRows.length - coveredCount

    const coverage =
        frameworkRows.length > 0
            ? (coveredCount / frameworkRows.length) * 100
            : 0

    return (
        <div className="p-6">

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <ShieldCheck
                        size={18}
                        style={{
                            color: 'var(--accent-action)',
                        }}
                    />

                    <h1
                        className="text-xl font-semibold"
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
                    Map implemented security controls to major cybersecurity frameworks.
                </p>
            </div>

            {/* Framework Selector */}
            <div
                className="rounded-lg border p-5"
                style={{
                    borderColor: 'var(--border-hairline)',
                    background: 'var(--bg-surface)',
                }}
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                    <div>
                        <label
                            className="mb-2 block text-xs font-medium"
                            style={{
                                color: 'var(--text-secondary)',
                            }}
                        >
                            Compliance Framework
                        </label>

                        <select
                            value={framework}
                            onChange={(event) =>
                                setFramework(event.target.value)
                            }
                            className="min-w-60 rounded-md border px-3 py-2.5 text-sm outline-none"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-base)',
                                color: 'var(--text-primary)',
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
                        className="text-xs"
                        style={{
                            color: 'var(--text-tertiary)',
                        }}
                    >
                        Showing mappings for{' '}
                        <span
                            className="font-medium"
                            style={{
                                color: 'var(--text-secondary)',
                            }}
                        >
                            {framework}
                        </span>
                    </div>

                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div
                    className="mt-6 rounded-lg border p-6 text-sm"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    Loading compliance mappings...
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Content */}
            {!loading && !error && (
                <>
                    {/* Summary */}
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

                        {/* Coverage */}
                        <div
                            className="rounded-lg border p-4"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-surface)',
                            }}
                        >
                            <p
                                className="text-xs"
                                style={{
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Framework Coverage
                            </p>

                            <p className="mt-2 text-3xl font-semibold text-emerald-400">
                                {coverage.toFixed(0)}%
                            </p>

                            <div
                                className="mt-3 h-2 overflow-hidden rounded-full"
                                style={{
                                    background: 'var(--bg-surface-raised)',
                                }}
                            >
                                <div
                                    className="h-full rounded-full bg-emerald-400"
                                    style={{
                                        width: `${coverage}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Covered */}
                        <div
                            className="rounded-lg border p-4"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-surface)',
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle2
                                    size={16}
                                    className="text-emerald-400"
                                />

                                <p
                                    className="text-xs"
                                    style={{
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    Covered Controls
                                </p>
                            </div>

                            <p
                                className="mt-2 text-3xl font-semibold"
                                style={{
                                    color: 'var(--text-primary)',
                                }}
                            >
                                {coveredCount}
                            </p>
                        </div>

                        {/* Gaps */}
                        <div
                            className="rounded-lg border p-4"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-surface)',
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle
                                    size={16}
                                    className="text-orange-400"
                                />

                                <p
                                    className="text-xs"
                                    style={{
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    Mapping Gaps
                                </p>
                            </div>

                            <p className="mt-2 text-3xl font-semibold text-orange-400">
                                {gapCount}
                            </p>
                        </div>
                    </div>

                    {/* Mapping Table */}
                    <div
                        className="mt-6 overflow-hidden rounded-lg border"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                        }}
                    >
                        <div
                            className="border-b px-5 py-4"
                            style={{
                                borderColor: 'var(--border-hairline)',
                            }}
                        >
                            <h2
                                className="text-sm font-semibold"
                                style={{
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Control Mapping
                            </h2>

                            <p
                                className="mt-1 text-xs"
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                Security controls mapped against {framework}.
                            </p>
                        </div>

                        {frameworkRows.length === 0 ? (
                            <div
                                className="px-5 py-10 text-center text-sm"
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                No security controls found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr
                                            className="border-b text-xs"
                                            style={{
                                                borderColor: 'var(--border-hairline)',
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            <th className="px-5 py-3 font-medium">
                                                Security Control
                                            </th>

                                            <th className="px-5 py-3 font-medium">
                                                Framework Reference
                                            </th>

                                            <th className="px-5 py-3 font-medium">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {frameworkRows.map((item) => (
                                            <tr
                                                key={item.control}
                                                className="border-b last:border-b-0"
                                                style={{
                                                    borderColor:
                                                        'var(--border-hairline-soft)',
                                                }}
                                            >
                                                <td
                                                    className="px-5 py-4 text-sm font-medium"
                                                    style={{
                                                        color: 'var(--text-primary)',
                                                    }}
                                                >
                                                    {item.control}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {item.covered ? (
                                                        <div className="space-y-1">
                                                            {item.clauses.map((clause) => (
                                                                <div
                                                                    key={clause}
                                                                    className="text-sm"
                                                                    style={{
                                                                        color:
                                                                            'var(--text-secondary)',
                                                                    }}
                                                                >
                                                                    {clause}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className="text-sm"
                                                            style={{
                                                                color:
                                                                    'var(--text-tertiary)',
                                                            }}
                                                        >
                                                            No mapping available
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {item.covered ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                                                            <CheckCircle2 size={12} />
                                                            Covered
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-400">
                                                            <AlertTriangle size={12} />
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
                    </div>
                </>
            )}
        </div>
    )
}