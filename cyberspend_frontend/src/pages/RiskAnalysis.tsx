import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, ShieldAlert, TrendingUp } from 'lucide-react'

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

function severityClass(severity: RiskItem['severity']) {
    switch (severity) {
        case 'Critical':
            return 'border-red-500/30 bg-red-500/10 text-red-400'

        case 'High':
            return 'border-orange-500/30 bg-orange-500/10 text-orange-400'

        case 'Medium':
            return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'

        default:
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    }
}

function riskScoreClass(score: number) {
    if (score >= 75) return 'text-red-400'
    if (score >= 50) return 'text-orange-400'
    if (score >= 25) return 'text-yellow-400'

    return 'text-emerald-400'
}

export default function RiskAnalysis() {
    const [summary, setSummary] = useState<RiskSummary | null>(null)
    const [risks, setRisks] = useState<RiskItem[]>([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadRiskData() {
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
                setError('Failed to load risk analysis.')
            } finally {
                setLoading(false)
            }
        }

        loadRiskData()
    }, [])

    if (loading) {
        return (
            <div className="p-6">
                <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Loading risk analysis...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <div
                    className="rounded-md border p-4"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    {error}
                </div>
            </div>
        )
    }

    if (!summary) {
        return null
    }

    const riskLevel =
        summary.overallRiskScore >= 75
            ? 'Critical'
            : summary.overallRiskScore >= 50
                ? 'High'
                : summary.overallRiskScore >= 25
                    ? 'Medium'
                    : 'Low'

    return (
        <div className="p-6">

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <Activity
                        size={18}
                        style={{ color: 'var(--accent-action)' }}
                    />

                    <h1
                        className="text-xl font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Risk Analysis
                    </h1>
                </div>

                <p
                    className="mt-1 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Analyze cyber risk, financial exposure, and highest-risk vulnerabilities.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

                {/* Overall Risk */}
                <div
                    className="rounded-lg border p-4"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                    }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <span
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Overall Risk Score
                        </span>

                        <Activity
                            size={16}
                            style={{ color: 'var(--text-tertiary)' }}
                        />
                    </div>

                    <div
                        className={`text-3xl font-semibold ${riskScoreClass(
                            summary.overallRiskScore,
                        )}`}
                    >
                        {summary.overallRiskScore.toFixed(1)}
                    </div>

                    <div
                        className="mt-1 text-xs font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {riskLevel} Risk
                    </div>
                </div>

                {/* EAL */}
                <div
                    className="rounded-lg border p-4"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                    }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <span
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Expected Annual Loss
                        </span>

                        <TrendingUp
                            size={16}
                            style={{ color: 'var(--text-tertiary)' }}
                        />
                    </div>

                    <div
                        className="text-2xl font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {formatINR(summary.expectedAnnualLoss)}
                    </div>

                    <div
                        className="mt-1 text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        Estimated financial exposure
                    </div>
                </div>

                {/* Assets */}
                <div
                    className="rounded-lg border p-4"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                    }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <span
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Total Assets
                        </span>

                        <ShieldAlert
                            size={16}
                            style={{ color: 'var(--text-tertiary)' }}
                        />
                    </div>

                    <div
                        className="text-3xl font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {summary.totalAssets}
                    </div>
                </div>

                {/* Critical Vulnerabilities */}
                <div
                    className="rounded-lg border p-4"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                    }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <span
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Critical Vulnerabilities
                        </span>

                        <AlertTriangle
                            size={16}
                            style={{ color: 'var(--text-tertiary)' }}
                        />
                    </div>

                    <div className="text-3xl font-semibold text-red-400">
                        {summary.criticalVulnerabilities}
                    </div>
                </div>

                {/* Exploitable */}
                <div
                    className="rounded-lg border p-4"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                    }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <span
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Exploitable Vulnerabilities
                        </span>

                        <AlertTriangle
                            size={16}
                            style={{ color: 'var(--text-tertiary)' }}
                        />
                    </div>

                    <div className="text-3xl font-semibold text-orange-400">
                        {summary.exploitableVulnerabilities}
                    </div>
                </div>
            </div>

            {/* Top Risks */}
            <div
                className="mt-6 overflow-hidden rounded-lg border"
                style={{
                    borderColor: 'var(--border-hairline)',
                    background: 'var(--bg-surface)',
                }}
            >
                <div className="border-b px-5 py-4"
                    style={{
                        borderColor: 'var(--border-hairline)',
                    }}
                >
                    <h2
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Top Risk Contributors
                    </h2>

                    <p
                        className="mt-1 text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        Vulnerabilities with the highest calculated residual risk.
                    </p>
                </div>

                {risks.length === 0 ? (
                    <div
                        className="px-5 py-10 text-center text-sm"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        No vulnerabilities found.
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
                                        Vulnerability
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        Asset
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        Likelihood
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        Risk Score
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        EAL
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        Severity
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {risks.map((risk) => (
                                    <tr
                                        key={risk.vulnerabilityId}
                                        className="border-b last:border-b-0"
                                        style={{
                                            borderColor: 'var(--border-hairline-soft)',
                                        }}
                                    >
                                        <td className="px-5 py-4">
                                            <div
                                                className="text-sm font-medium"
                                                style={{
                                                    color: 'var(--text-primary)',
                                                }}
                                            >
                                                {risk.vulnerabilityName}
                                            </div>

                                            <div
                                                className="mt-0.5 text-xs"
                                                style={{
                                                    color: 'var(--text-tertiary)',
                                                }}
                                            >
                                                {risk.vulnerabilityId}
                                            </div>
                                        </td>

                                        <td
                                            className="px-5 py-4 text-sm"
                                            style={{
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {risk.assetName}
                                        </td>

                                        <td
                                            className="px-5 py-4 text-sm"
                                            style={{
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {(risk.likelihood * 100).toFixed(1)}%
                                        </td>

                                        <td
                                            className={`px-5 py-4 text-sm font-semibold ${riskScoreClass(
                                                risk.residualRiskScore,
                                            )}`}
                                        >
                                            {risk.residualRiskScore.toFixed(1)}
                                        </td>

                                        <td
                                            className="px-5 py-4 text-sm"
                                            style={{
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {formatINR(risk.eal)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${severityClass(
                                                    risk.severity,
                                                )}`}
                                            >
                                                {risk.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    )
}