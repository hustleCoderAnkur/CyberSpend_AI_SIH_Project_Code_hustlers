import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Activity,
    AlertTriangle,
    RefreshCw,
    ShieldAlert,
    TrendingUp,
} from 'lucide-react'

import { getRiskSummary, getRisks } from '../api/risk'
import type { RiskItem } from '../types'
import { formatINR } from '../lib/format'

interface RiskSummary {
    totalAssets: number
    totalVulnerabilities: number
    criticalVulnerabilities: number
    exploitableVulnerabilities: number
    overallRiskScore: number
    expectedAnnualLoss: number
    topRisks: RiskItem[]
}

function getRiskLevel(score: number) {
    if (score >= 75) return 'Critical'
    if (score >= 50) return 'High'
    if (score >= 25) return 'Medium'
    return 'Low'
}

function getRiskStyle(score: number) {
    if (score >= 75) {
        return {
            background: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
        }
    }

    if (score >= 50) {
        return {
            background: '#FFF7ED',
            color: '#C2410C',
        }
    }

    if (score >= 25) {
        return {
            background: 'var(--status-warning-bg)',
            color: 'var(--status-warning-text)',
        }
    }

    return {
        background: 'var(--status-success-bg)',
        color: 'var(--status-success-text)',
    }
}

function getSeverityStyle(
    severity: RiskItem['severity'],
) {
    switch (severity) {
        case 'Critical':
            return {
                background: 'var(--status-danger-bg)',
                color: 'var(--status-danger-text)',
            }

        case 'High':
            return {
                background: '#FFF7ED',
                color: '#C2410C',
            }

        case 'Medium':
            return {
                background: 'var(--status-warning-bg)',
                color: 'var(--status-warning-text)',
            }

        default:
            return {
                background: 'var(--status-success-bg)',
                color: 'var(--status-success-text)',
            }
    }
}

function getScoreTextClass(score: number) {
    if (score >= 75) return 'var(--risk-critical)'
    if (score >= 50) return 'var(--risk-high)'
    if (score >= 25) return 'var(--risk-medium)'
    return 'var(--risk-safe)'
}

export default function RiskAnalysis() {
    const [summary, setSummary] =
        useState<RiskSummary | null>(null)

    const [risks, setRisks] = useState<RiskItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const loadRiskData = useCallback(async () => {
        try {
            setLoading(true)
            setError('')

            const [summaryData, riskData] = await Promise.all([
                getRiskSummary(),
                getRisks(),
            ])

            setSummary(summaryData)
            setRisks(riskData)
        } catch (err) {
            console.error(err)
            setError(
                'Failed to load risk analysis. Please try again.',
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadRiskData()
    }, [loadRiskData])

    const riskLevel = useMemo(() => {
        if (!summary) return 'Low'
        return getRiskLevel(summary.overallRiskScore)
    }, [summary])

    const overallRiskStyle = useMemo(() => {
        if (!summary) {
            return {
                background: 'var(--bg-surface-raised)',
                color: 'var(--text-secondary)',
            }
        }

        return getRiskStyle(summary.overallRiskScore)
    }, [summary])

    if (loading) {
        return (
            <div
                className="min-h-screen"
                style={{ background: 'var(--bg-base)' }}
            >
                <div className="mx-auto w-full max-w-7xl px-6 py-7 lg:px-8">
                    <div>
                        <div
                            className="h-6 w-36 animate-pulse rounded"
                            style={{
                                background: 'var(--bg-surface-raised)',
                            }}
                        />

                        <div
                            className="mt-2 h-4 w-80 max-w-full animate-pulse rounded"
                            style={{
                                background: 'var(--bg-surface-raised)',
                            }}
                        />
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-28 animate-pulse rounded-lg border"
                                style={{
                                    borderColor:
                                        'var(--border-hairline)',
                                    background:
                                        'var(--bg-surface)',
                                }}
                            />
                        ))}
                    </div>

                    <div
                        className="mt-6 h-80 animate-pulse rounded-lg border"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                        }}
                    />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div
                className="min-h-screen"
                style={{ background: 'var(--bg-base)' }}
            >
                <div className="mx-auto w-full max-w-7xl px-6 py-7 lg:px-8">
                    <div
                        className="rounded-lg border p-5"
                        style={{
                            borderColor: '#FECACA',
                            background: 'var(--status-danger-bg)',
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle
                                size={17}
                                style={{
                                    color: 'var(--status-danger-text)',
                                }}
                            />

                            <div className="min-w-0">
                                <p
                                    className="text-sm font-medium"
                                    style={{
                                        color:
                                            'var(--status-danger-text)',
                                    }}
                                >
                                    Unable to load risk analysis
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
                                    onClick={loadRiskData}
                                    className="mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] font-medium"
                                    style={{
                                        borderColor: '#FECACA',
                                        background: 'var(--bg-surface)',
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    <RefreshCw size={13} />
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!summary) {
        return (
            <div
                className="min-h-screen"
                style={{ background: 'var(--bg-base)' }}
            >
                <div className="mx-auto max-w-7xl px-6 py-7">
                    <p
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        No risk analysis data available.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="min-h-screen"
            style={{ background: 'var(--bg-base)' }}
        >
            <div className="mx-auto w-full max-w-7xl px-6 py-7 lg:px-8">
                {/* Header */}
                <header>
                    <div className="flex items-center gap-2">
                        <Activity
                            size={18}
                            strokeWidth={1.8}
                            style={{ color: 'var(--text-primary)' }}
                        />

                        <h1
                            className="text-xl font-semibold tracking-tight"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Risk Analysis
                        </h1>
                    </div>

                    <p
                        className="mt-1 text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Analyze cyber risk, financial exposure, and
                        highest-risk vulnerabilities.
                    </p>
                </header>

                {/* Summary cards */}
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {/* Overall Risk */}
                    <div
                        className="rounded-lg border p-4"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className="text-[12px] font-medium"
                                style={{
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Overall Risk Score
                            </span>

                            <Activity
                                size={15}
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            />
                        </div>

                        <div className="mt-4 flex items-end gap-2">
                            <span
                                className="font-data text-3xl font-medium leading-none"
                                style={{
                                    color: getScoreTextClass(
                                        summary.overallRiskScore,
                                    ),
                                }}
                            >
                                {summary.overallRiskScore.toFixed(1)}
                            </span>

                            <span
                                className="mb-0.5 rounded-full px-2 py-1 text-[10px] font-medium"
                                style={overallRiskStyle}
                            >
                                {riskLevel}
                            </span>
                        </div>
                    </div>

                    {/* EAL */}
                    <div
                        className="rounded-lg border p-4"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className="text-[12px] font-medium"
                                style={{
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Expected Annual Loss
                            </span>

                            <TrendingUp
                                size={15}
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            />
                        </div>

                        <div
                            className="font-data mt-4 text-2xl font-medium leading-none"
                            style={{
                                color: 'var(--text-primary)',
                            }}
                        >
                            {formatINR(summary.expectedAnnualLoss)}
                        </div>

                        <p
                            className="mt-2 text-[11px]"
                            style={{
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            Estimated financial exposure
                        </p>
                    </div>

                    {/* Assets */}
                    <div
                        className="rounded-lg border p-4"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className="text-[12px] font-medium"
                                style={{
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Total Assets
                            </span>

                            <ShieldAlert
                                size={15}
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            />
                        </div>

                        <div
                            className="font-data mt-4 text-3xl font-medium leading-none"
                            style={{
                                color: 'var(--text-primary)',
                            }}
                        >
                            {summary.totalAssets}
                        </div>
                    </div>

                    {/* Critical vulnerabilities */}
                    <div
                        className="rounded-lg border p-4"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className="text-[12px] font-medium"
                                style={{
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Critical Vulnerabilities
                            </span>

                            <AlertTriangle
                                size={15}
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            />
                        </div>

                        <div
                            className="font-data mt-4 text-3xl font-medium leading-none"
                            style={{
                                color: 'var(--risk-critical)',
                            }}
                        >
                            {summary.criticalVulnerabilities}
                        </div>
                    </div>

                    {/* Exploitable */}
                    <div
                        className="rounded-lg border p-4"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className="text-[12px] font-medium"
                                style={{
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Exploitable Vulnerabilities
                            </span>

                            <AlertTriangle
                                size={15}
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            />
                        </div>

                        <div
                            className="font-data mt-4 text-3xl font-medium leading-none"
                            style={{
                                color: 'var(--risk-high)',
                            }}
                        >
                            {summary.exploitableVulnerabilities}
                        </div>
                    </div>
                </div>

                {/* Risk table */}
                <section
                    className="mt-6 overflow-hidden rounded-lg border"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    <div
                        className="flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{
                            borderColor:
                                'var(--border-hairline-soft)',
                        }}
                    >
                        <div>
                            <h2
                                className="text-sm font-semibold"
                                style={{
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Top Risk Contributors
                            </h2>

                            <p
                                className="mt-0.5 text-[11px]"
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                Vulnerabilities with the highest
                                calculated residual risk.
                            </p>
                        </div>

                        <span
                            className="font-data text-[11px]"
                            style={{
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            {risks.length} risks
                        </span>
                    </div>

                    {risks.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div
                                className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border"
                                style={{
                                    borderColor:
                                        'var(--border-hairline)',
                                    background: 'var(--bg-base)',
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                <ShieldAlert size={17} />
                            </div>

                            <h3
                                className="mt-3 text-sm font-medium"
                                style={{
                                    color: 'var(--text-primary)',
                                }}
                            >
                                No risks identified
                            </h3>

                            <p
                                className="mt-1 text-[12px]"
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                No vulnerability risk records are
                                currently available.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead
                                    className="border-b"
                                    style={{
                                        borderColor:
                                            'var(--border-hairline-soft)',
                                        background: 'var(--bg-base)',
                                    }}
                                >
                                    <tr>
                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{
                                                color:
                                                    'var(--text-tertiary)',
                                            }}
                                        >
                                            Vulnerability
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{
                                                color:
                                                    'var(--text-tertiary)',
                                            }}
                                        >
                                            Asset
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{
                                                color:
                                                    'var(--text-tertiary)',
                                            }}
                                        >
                                            Likelihood
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{
                                                color:
                                                    'var(--text-tertiary)',
                                            }}
                                        >
                                            Risk Score
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{
                                                color:
                                                    'var(--text-tertiary)',
                                            }}
                                        >
                                            EAL
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{
                                                color:
                                                    'var(--text-tertiary)',
                                            }}
                                        >
                                            Severity
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {risks.map((risk) => {
                                        const severityStyle =
                                            getSeverityStyle(risk.severity)

                                        const score = Math.min(
                                            Math.max(
                                                risk.residualRiskScore,
                                                0,
                                            ),
                                            100,
                                        )

                                        return (
                                            <tr
                                                key={risk.vulnerabilityId}
                                                className="border-b last:border-0 transition-colors duration-100"
                                                style={{
                                                    borderColor:
                                                        'var(--border-hairline-soft)',
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
                                                {/* Vulnerability */}
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <div
                                                            className="text-[13px] font-medium"
                                                            style={{
                                                                color:
                                                                    'var(--text-primary)',
                                                            }}
                                                        >
                                                            {risk.vulnerabilityName}
                                                        </div>

                                                        <div
                                                            className="font-data mt-0.5 text-[10px]"
                                                            style={{
                                                                color:
                                                                    'var(--text-tertiary)',
                                                            }}
                                                        >
                                                            {risk.vulnerabilityId}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Asset */}
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <div
                                                            className="text-[12px]"
                                                            style={{
                                                                color:
                                                                    'var(--text-secondary)',
                                                            }}
                                                        >
                                                            {risk.assetName}
                                                        </div>

                                                        <div
                                                            className="font-data mt-0.5 text-[10px]"
                                                            style={{
                                                                color:
                                                                    'var(--text-tertiary)',
                                                            }}
                                                        >
                                                            {risk.assetId}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Likelihood */}
                                                <td
                                                    className="font-data px-5 py-4 text-[12px]"
                                                    style={{
                                                        color:
                                                            'var(--text-secondary)',
                                                    }}
                                                >
                                                    {(risk.likelihood * 100).toFixed(
                                                        1,
                                                    )}
                                                    %
                                                </td>

                                                {/* Risk score */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className="h-1.5 w-16 overflow-hidden rounded-full"
                                                            style={{
                                                                background:
                                                                    'var(--bg-surface-raised)',
                                                            }}
                                                        >
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${score}%`,
                                                                    background:
                                                                        getScoreTextClass(
                                                                            risk.residualRiskScore,
                                                                        ),
                                                                }}
                                                            />
                                                        </div>

                                                        <span
                                                            className="font-data text-[12px] font-medium"
                                                            style={{
                                                                color:
                                                                    getScoreTextClass(
                                                                        risk.residualRiskScore,
                                                                    ),
                                                            }}
                                                        >
                                                            {risk.residualRiskScore.toFixed(
                                                                1,
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* EAL */}
                                                <td
                                                    className="font-data px-5 py-4 text-[12px]"
                                                    style={{
                                                        color:
                                                            'var(--text-secondary)',
                                                    }}
                                                >
                                                    {formatINR(risk.eal)}
                                                </td>

                                                {/* Severity */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className="inline-flex rounded-full px-2 py-1 text-[10px] font-medium"
                                                        style={severityStyle}
                                                    >
                                                        {risk.severity}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}