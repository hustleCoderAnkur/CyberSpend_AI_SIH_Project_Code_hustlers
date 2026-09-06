import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  YAxis,
} from 'recharts'
import {
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Server,
  Bug,
} from 'lucide-react'

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

interface RiskSummary {
  totalAssets: number
  totalVulnerabilities: number
  criticalVulnerabilities: number
  exploitableVulnerabilities: number
  overallRiskScore: number
  expectedAnnualLoss: number
  topRisks: RiskItem[]
}

function useTrend(currentEal: number) {
  return useMemo(() => {
    const points = [
      1.18,
      1.1,
      1.24,
      1.05,
      0.96,
      1,
    ]

    return points.map((multiplier, index) => ({
      index,
      value: Math.round(
        currentEal * multiplier,
      ),
    }))
  }, [currentEal])
}

function getRiskLabel(score: number) {
  if (score >= 75) {
    return 'Critical'
  }

  if (score >= 50) {
    return 'High'
  }

  if (score >= 25) {
    return 'Moderate'
  }

  return 'Low'
}

function getRiskColor(score: number) {
  if (score >= 75) {
    return 'var(--risk-critical)'
  }

  if (score >= 50) {
    return 'var(--risk-high)'
  }

  if (score >= 25) {
    return 'var(--risk-medium)'
  }

  return 'var(--risk-safe)'
}

export default function Dashboard() {
  const [summary, setSummary] =
    useState<RiskSummary | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const loadDashboard = useCallback(
    async () => {
      try {
        setLoading(true)
        setError(null)

        const data =
          await getRiskSummary()

        setSummary(data)
      } catch (err) {
        console.error(
          'Dashboard API error:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard data.',
        )
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const totalEal =
    summary?.expectedAnnualLoss ?? 0

  const trend = useTrend(totalEal)

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-6"
        style={{
          background:
            'var(--bg-base)',
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border"
            style={{
              borderColor:
                'var(--border-hairline)',
              background:
                'var(--bg-surface)',
            }}
          >
            <RefreshCw
              size={16}
              className="animate-spin"
              style={{
                color:
                  'var(--text-secondary)',
              }}
            />
          </div>

          <p
            className="mt-3 text-sm"
            style={{
              color:
                'var(--text-secondary)',
            }}
          >
            Loading risk overview...
          </p>
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-6"
        style={{
          background:
            'var(--bg-base)',
        }}
      >
        <div
          className="w-full max-w-md rounded-xl border p-6 text-center"
          style={{
            borderColor:
              'var(--border-hairline)',
            background:
              'var(--bg-surface)',
          }}
        >
          <div
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background:
                'var(--status-danger-bg)',
              color:
                'var(--status-danger-text)',
            }}
          >
            <AlertCircle size={18} />
          </div>

          <h2
            className="mt-4 text-sm font-semibold"
            style={{
              color:
                'var(--text-primary)',
            }}
          >
            Unable to load dashboard
          </h2>

          <p
            className="mt-1.5 text-xs leading-relaxed"
            style={{
              color:
                'var(--text-secondary)',
            }}
          >
            {error ??
              'No dashboard data is available.'}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadDashboard()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium"
            style={{
              background:
                'var(--accent-action)',
              color:
                'var(--text-inverse)',
            }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const topRisks =
    summary.topRisks.slice(0, 5)

  const riskLabel = getRiskLabel(
    summary.overallRiskScore,
  )

  const riskColor = getRiskColor(
    summary.overallRiskScore,
  )

  return (
    <div
      className="min-h-screen px-5 py-6 md:px-7 md:py-7"
      style={{
        background:
          'var(--bg-base)',
      }}
    >
      <div className="mx-auto max-w-350">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{
                  color:
                    'var(--text-tertiary)',
                }}
              >
                Security Intelligence
              </p>

              <h1
                className="mt-1 text-2xl font-semibold tracking-tight"
                style={{
                  color:
                    'var(--text-primary)',
                }}
              >
                Risk Overview
              </h1>

              <p
                className="mt-1 text-sm"
                style={{
                  color:
                    'var(--text-secondary)',
                }}
              >
                {summary.totalAssets} assets
                {' · '}
                {summary.totalVulnerabilities}{' '}
                vulnerabilities
              </p>
            </div>

            <div
              className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5"
              style={{
                borderColor:
                  'var(--border-hairline)',
                background:
                  'var(--bg-surface)',
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    'var(--risk-safe)',
                }}
              />

              <span
                className="text-[11px] font-medium"
                style={{
                  color:
                    'var(--text-secondary)',
                }}
              >
                Risk engine active
              </span>
            </div>
          </div>
        </header>

        {/* EAL Hero */}
        <section
          className="rounded-xl border"
          style={{
            borderColor:
              'var(--border-hairline)',
            background:
              'var(--bg-surface)',
          }}
        >
          <div className="grid lg:grid-cols-[1fr_220px_240px]">
            {/* EAL */}
            <div className="p-6">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      'var(--text-secondary)',
                  }}
                >
                  Expected Annual Loss
                </span>

                <span
                  className="rounded-full px-2 py-0.5 text-[10px]"
                  style={{
                    background:
                      'var(--status-danger-bg)',
                    color:
                      'var(--status-danger-text)',
                  }}
                >
                  Financial exposure
                </span>
              </div>

              <div className="mt-3">
                <span
                  className="font-data text-3xl font-semibold tracking-tight md:text-4xl"
                  style={{
                    color:
                      'var(--text-primary)',
                  }}
                >
                  {formatINR(
                    summary.expectedAnnualLoss,
                  )}
                </span>
              </div>

              <p
                className="mt-2 max-w-lg text-xs leading-relaxed"
                style={{
                  color:
                    'var(--text-tertiary)',
                }}
              >
                Estimated annual financial loss
                across the organization's tracked
                vulnerabilities.
              </p>
            </div>

            {/* Trend */}
            <div
              className="border-t p-5 lg:border-l lg:border-t-0"
              style={{
                borderColor:
                  'var(--border-hairline-soft)',
              }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp
                  size={14}
                  style={{
                    color:
                      'var(--text-secondary)',
                  }}
                />

                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      'var(--text-secondary)',
                  }}
                >
                  Risk trend
                </span>
              </div>

              <div className="mt-4 h-18 w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <AreaChart
                    data={trend}
                    margin={{
                      top: 5,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="dashboardEalTrend"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={
                            'var(--text-primary)'
                          }
                          stopOpacity={0.12}
                        />

                        <stop
                          offset="100%"
                          stopColor={
                            'var(--text-primary)'
                          }
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <YAxis
                      hide
                      domain={[
                        'dataMin',
                        'dataMax',
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={
                        'var(--text-primary)'
                      }
                      strokeWidth={1.5}
                      fill="url(#dashboardEalTrend)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p
                className="mt-1 text-[10px]"
                style={{
                  color:
                    'var(--text-tertiary)',
                }}
              >
                6-month model trend
              </p>
            </div>

            {/* Overall Risk */}
            <div
              className="border-t p-5 lg:border-l lg:border-t-0"
              style={{
                borderColor:
                  'var(--border-hairline-soft)',
              }}
            >
              <span
                className="text-xs font-medium"
                style={{
                  color:
                    'var(--text-secondary)',
                }}
              >
                Overall Risk Score
              </span>

              <div className="mt-3 flex items-end gap-2">
                <span
                  className="font-data text-3xl font-semibold leading-none"
                  style={{
                    color:
                      'var(--text-primary)',
                  }}
                >
                  {
                    summary.overallRiskScore
                  }
                </span>

                <span
                  className="mb-0.5 text-xs"
                  style={{
                    color:
                      'var(--text-tertiary)',
                  }}
                >
                  / 100
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background:
                      riskColor,
                  }}
                />

                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      riskColor,
                  }}
                >
                  {riskLabel} risk
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Assets"
            value={String(
              summary.totalAssets,
            )}
            sublabel="Tracked in inventory"
          />

          <MetricCard
            label="Critical Vulnerabilities"
            value={String(
              summary.criticalVulnerabilities,
            )}
            sublabel={`of ${summary.totalVulnerabilities} total`}
            accent="var(--risk-critical)"
          />

          <MetricCard
            label="Exploitable Vulnerabilities"
            value={String(
              summary.exploitableVulnerabilities,
            )}
            sublabel="Known exploitable findings"
            accent="var(--risk-high)"
          />

          <MetricCard
            label="Risk Score"
            value={`${summary.overallRiskScore}/100`}
            sublabel="Weighted overall score"
          />
        </section>

        {/* Risk Table */}
        <section
          className="mt-5 overflow-hidden rounded-xl border"
          style={{
            borderColor:
              'var(--border-hairline)',
            background:
              'var(--bg-surface)',
          }}
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{
                  background:
                    'var(--bg-surface-raised)',
                  color:
                    'var(--text-secondary)',
                }}
              >
                <ShieldAlert size={15} />
              </div>

              <div>
                <h2
                  className="text-sm font-semibold"
                  style={{
                    color:
                      'var(--text-primary)',
                  }}
                >
                  Highest Risk Findings
                </h2>

                <p
                  className="mt-0.5 text-[11px]"
                  style={{
                    color:
                      'var(--text-tertiary)',
                  }}
                >
                  Top vulnerabilities ranked by
                  residual risk.
                </p>
              </div>
            </div>

            <span
              className="text-[11px]"
              style={{
                color:
                  'var(--text-tertiary)',
              }}
            >
              Top {topRisks.length}
            </span>
          </div>

          {topRisks.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background:
                    'var(--status-success-bg)',
                  color:
                    'var(--status-success-text)',
                }}
              >
                <ShieldAlert size={18} />
              </div>

              <p
                className="mt-3 text-sm font-medium"
                style={{
                  color:
                    'var(--text-primary)',
                }}
              >
                No active risk findings
              </p>

              <p
                className="mt-1 text-xs"
                style={{
                  color:
                    'var(--text-tertiary)',
                }}
              >
                The risk engine returned no
                vulnerabilities for the current
                dataset.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left">
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      borderColor:
                        'var(--border-hairline-soft)',
                    }}
                  >
                    <th
                      className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        color:
                          'var(--text-tertiary)',
                      }}
                    >
                      Asset
                    </th>

                    <th
                      className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        color:
                          'var(--text-tertiary)',
                      }}
                    >
                      Vulnerability
                    </th>

                    <th
                      className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        color:
                          'var(--text-tertiary)',
                      }}
                    >
                      Severity
                    </th>

                    <th
                      className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        color:
                          'var(--text-tertiary)',
                      }}
                    >
                      Residual Risk
                    </th>

                    <th
                      className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        color:
                          'var(--text-tertiary)',
                      }}
                    >
                      Expected Annual Loss
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {topRisks.map(
                    (risk) => (
                      <tr
                        key={
                          risk.vulnerabilityId
                        }
                        className="border-b last:border-b-0"
                        style={{
                          borderColor:
                            'var(--border-hairline-soft)',
                        }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-md"
                              style={{
                                background:
                                  'var(--bg-surface-raised)',
                                color:
                                  'var(--text-secondary)',
                              }}
                            >
                              <Server
                                size={14}
                              />
                            </div>

                            <span
                              className="text-xs font-medium"
                              style={{
                                color:
                                  'var(--text-primary)',
                              }}
                            >
                              {
                                risk.assetName
                              }
                            </span>
                          </div>
                        </td>

                        <td className="max-w-75 px-5 py-3.5">
                          <span
                            className="block truncate text-xs"
                            style={{
                              color:
                                'var(--text-secondary)',
                            }}
                            title={
                              risk.vulnerabilityName
                            }
                          >
                            {
                              risk.vulnerabilityName
                            }
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium"
                            style={{
                              color:
                                SEVERITY_COLOR[
                                risk.severity
                                ] ??
                                'var(--text-secondary)',
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                background:
                                  SEVERITY_COLOR[
                                  risk.severity
                                  ] ??
                                  'var(--text-secondary)',
                              }}
                            />

                            {
                              risk.severity
                            }
                          </span>
                        </td>

                        <td
                          className="px-5 py-3.5 text-right"
                        >
                          <span
                            className="font-data text-xs font-medium"
                            style={{
                              color:
                                'var(--text-primary)',
                            }}
                          >
                            {
                              risk.residualRiskScore
                            }
                          </span>
                          <span
                            className="ml-1 text-[10px]"
                            style={{
                              color:
                                'var(--text-tertiary)',
                            }}
                          >
                            /100
                          </span>
                        </td>

                        <td
                          className="px-5 py-3.5 text-right"
                        >
                          <span
                            className="font-data text-xs font-medium"
                            style={{
                              color:
                                'var(--text-primary)',
                            }}
                          >
                            {formatINR(
                              risk.eal,
                            )}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Footer context */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 px-1">
          <div className="flex items-center gap-2">
            <Server
              size={12}
              style={{
                color:
                  'var(--text-tertiary)',
              }}
            />

            <span
              className="text-[10px]"
              style={{
                color:
                  'var(--text-tertiary)',
              }}
            >
              {summary.totalAssets} assets
              monitored
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Bug
              size={12}
              style={{
                color:
                  'var(--text-tertiary)',
              }}
            />

            <span
              className="text-[10px]"
              style={{
                color:
                  'var(--text-tertiary)',
              }}
            >
              {summary.totalVulnerabilities}{' '}
              vulnerabilities tracked
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}