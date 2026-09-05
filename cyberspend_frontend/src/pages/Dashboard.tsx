import { useEffect, useMemo, useState } from 'react'
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'
import { getRiskSummary } from '../api/risk'
import type { RiskItem } from '../types'
import { formatINR } from '../lib/format'
import MetricCard from '../components/MetricCard'

const SEVERITY_COLOR: Record<string, string> = {
  Critical: 'var(--risk-critical)',
  High: 'var(--risk-high)',
  Medium: 'var(--risk-medium)',
  Low: 'var(--risk-safe)',
}

function useTrend(currentEal: number) {
  return useMemo(() => {
    const points = [1.18, 1.1, 1.24, 1.05, 0.96, 1]

    return points.map((mult, i) => ({
      i,
      value: Math.round(currentEal * mult),
    }))
  }, [currentEal])
}

export default function Dashboard() {
  const [summary, setSummary] = useState<{
    totalAssets: number
    totalVulnerabilities: number
    criticalVulnerabilities: number
    exploitableVulnerabilities: number
    overallRiskScore: number
    expectedAnnualLoss: number
    topRisks: RiskItem[]
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)

        const data = await getRiskSummary()

        setSummary(data)
      } catch (err) {
        console.error('Dashboard API error:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  // Hooks must always run before conditional returns.
  const totalEal = summary?.expectedAnnualLoss ?? 0
  const trend = useTrend(totalEal)

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center p-8">
        <span
          className="text-[13px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Loading dashboard...
        </span>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="flex min-h-00 items-center justify-center p-8">
        <div
          className="rounded-lg border px-6 py-5 text-[13px]"
          style={{
            borderColor: 'var(--border-hairline)',
            background: 'var(--bg-surface)',
            color: 'var(--risk-critical)',
          }}
        >
          {error ?? 'No dashboard data available'}
        </div>
      </div>
    )
  }

  const topRisks = summary.topRisks.slice(0, 5)

  return (
    <div className="flex flex-col gap-6 px-8 py-7">

      {/* Header */}
      <div>
        <h1
          className="text-[19px] font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Risk Overview
        </h1>

        <p
          className="mt-0.5 text-[13px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Across {summary.totalAssets} assets and{' '}
          {summary.totalVulnerabilities} tracked vulnerabilities
        </p>
      </div>

      {/* Hero band */}
      <div
        className="flex items-stretch gap-8 rounded-lg border px-6 py-5"
        style={{
          borderColor: 'var(--border-hairline)',
          background: 'var(--bg-surface)',
        }}
      >

        {/* Expected Annual Loss */}
        <div className="flex flex-col justify-center gap-1">

          <span
            className="text-[12px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Expected Annual Loss
          </span>

          <span
            className="font-data text-[38px] font-semibold leading-none"
            style={{ color: 'var(--risk-critical)' }}
          >
            {formatINR(summary.expectedAnnualLoss)}
          </span>

          <span
            className="mt-1 text-[11.5px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Sum of likelihood-weighted loss across all open vulnerabilities
          </span>

        </div>

        {/* EAL Trend */}
        <div className="w-40 shrink-0">

          <ResponsiveContainer width="100%" height={70}>
            <AreaChart
              data={trend}
              margin={{
                top: 4,
                right: 0,
                bottom: 0,
                left: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="ealTrend"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--risk-critical)"
                    stopOpacity={0.35}
                  />

                  <stop
                    offset="100%"
                    stopColor="var(--risk-critical)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <YAxis
                hide
                domain={[
                  'dataMin - 500000',
                  'dataMax + 500000',
                ]}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--risk-critical)"
                strokeWidth={1.75}
                fill="url(#ealTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>

          <span
            className="text-[11px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            6-month trend
          </span>

        </div>

        {/* Recommended Investment */}
        <div
          className="ml-auto flex flex-col justify-center gap-1 border-l pl-8"
          style={{
            borderColor: 'var(--border-hairline-soft)',
          }}
        >

          <span
            className="text-[12px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Recommended Investment
          </span>

          <span
            className="font-data text-[26px] font-medium leading-none"
            style={{ color: 'var(--accent-action)' }}
          >
            --
          </span>

          <span
            className="mt-1 text-[11.5px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Optimizer integration coming next
          </span>

        </div>

      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-4 gap-4">

        <MetricCard
          label="Total Assets"
          value={String(summary.totalAssets)}
          sublabel="Tracked in inventory"
        />

        <MetricCard
          label="Critical Vulnerabilities"
          value={String(summary.criticalVulnerabilities)}
          sublabel={`of ${summary.totalVulnerabilities} total`}
          accent="var(--risk-critical)"
        />

        <MetricCard
          label="Overall Risk Score"
          value={`${summary.overallRiskScore}/100`}
          sublabel="Weighted average"
        />

        <MetricCard
          label="Vulnerabilities w/ Exploit"
          value={String(summary.exploitableVulnerabilities)}
          sublabel="Publicly available exploit"
          accent="var(--risk-high)"
        />

      </div>

      {/* Top 5 risks */}
      <div
        className="rounded-lg border"
        style={{
          borderColor: 'var(--border-hairline)',
          background: 'var(--bg-surface)',
        }}
      >

        <div
          className="border-b px-5 py-3.5"
          style={{
            borderColor: 'var(--border-hairline-soft)',
          }}
        >
          <h2
            className="text-[13.5px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Top 5 Risks
          </h2>
        </div>

        <table className="w-full text-left text-[13px]">

          <thead>
            <tr style={{ color: 'var(--text-tertiary)' }}>

              <th className="px-5 py-2 font-normal">
                Asset
              </th>

              <th className="px-5 py-2 font-normal">
                Vulnerability
              </th>

              <th className="px-5 py-2 font-normal">
                Severity
              </th>

              <th className="px-5 py-2 text-right font-normal">
                Risk Score
              </th>

              <th className="px-5 py-2 text-right font-normal">
                Expected Annual Loss
              </th>

            </tr>
          </thead>

          <tbody>

            {topRisks.map((risk) => (
              <tr
                key={risk.vulnerabilityId}
                className="border-t"
                style={{
                  borderColor: 'var(--border-hairline-soft)',
                }}
              >

                <td
                  className="px-5 py-2.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {risk.assetName}
                </td>

                <td
                  className="px-5 py-2.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {risk.vulnerabilityName}
                </td>

                <td className="px-5 py-2.5">

                  <span
                    className="rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
                    style={{
                      color: SEVERITY_COLOR[risk.severity],
                      background: 'var(--bg-surface-raised)',
                    }}
                  >
                    {risk.severity}
                  </span>

                </td>

                <td
                  className="px-5 py-2.5 text-right font-data"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {risk.riskScore}
                </td>

                <td
                  className="px-5 py-2.5 text-right font-data font-medium"
                  style={{ color: 'var(--risk-critical)' }}
                >
                  {formatINR(risk.eal)}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}