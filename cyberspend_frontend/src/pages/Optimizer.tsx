import { useState } from 'react'
import type { FormEvent } from 'react'
import {
    Wallet,
    Calculator,
    ShieldCheck,
    TrendingDown,
    IndianRupee,
    RefreshCw,
} from 'lucide-react'

import { optimizeInvestment } from '../api/optimizer'
import type { OptimizerResult } from '../api/optimizer'
import { formatINR } from '../lib/format'

function getRosiStyle(rosi: number) {
    if (rosi >= 0) {
        return {
            background: 'var(--status-success-bg)',
            color: 'var(--status-success-text)',
        }
    }

    return {
        background: 'var(--status-danger-bg)',
        color: 'var(--status-danger-text)',
    }
}

export default function Optimizer() {
    const [budget, setBudget] = useState('5000000')
    const [result, setResult] =
        useState<OptimizerResult | null>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleOptimize(event: FormEvent) {
        event.preventDefault()

        const numericBudget = Number(budget)

        if (
            !Number.isFinite(numericBudget) ||
            numericBudget <= 0
        ) {
            setError('Please enter a valid budget greater than 0.')
            return
        }

        try {
            setLoading(true)
            setError('')

            const data =
                await optimizeInvestment(numericBudget)

            setResult(data)
        } catch (err) {
            console.error(err)
            setError(
                'Failed to calculate the recommended investment. Please try again.',
            )
        } finally {
            setLoading(false)
        }
    }

    const riskReductionPercent = result
        ? result.totalRiskReductionPct * 100
        : 0

    const estimatedSavings = result
        ? result.estimatedAnnualLoss *
        result.totalRiskReductionPct
        : 0

    return (
        <div
            className="min-h-screen"
            style={{ background: 'var(--bg-base)' }}
        >
            <div className="mx-auto w-full max-w-7xl px-6 py-7 lg:px-8">
                {/* Header */}
                <header>
                    <div className="flex items-center gap-2">
                        <Wallet
                            size={18}
                            strokeWidth={1.8}
                            style={{
                                color: 'var(--text-primary)',
                            }}
                        />

                        <h1
                            className="text-xl font-semibold tracking-tight"
                            style={{
                                color: 'var(--text-primary)',
                            }}
                        >
                            Investment Optimizer
                        </h1>
                    </div>

                    <p
                        className="mt-1 text-sm"
                        style={{
                            color: 'var(--text-secondary)',
                        }}
                    >
                        Find the best combination of security controls
                        within a fixed budget.
                    </p>
                </header>

                {/* Budget input */}
                <section
                    className="mt-6 rounded-lg border"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    <div
                        className="border-b px-5 py-4"
                        style={{
                            borderColor:
                                'var(--border-hairline-soft)',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <Calculator
                                size={15}
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            />

                            <h2
                                className="text-sm font-semibold"
                                style={{
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Set Investment Budget
                            </h2>
                        </div>

                        <p
                            className="mt-1 text-[11px]"
                            style={{
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            The optimizer will select controls that provide
                            the best risk reduction within this limit.
                        </p>
                    </div>

                    <form
                        onSubmit={handleOptimize}
                        className="flex flex-col gap-4 p-5 md:flex-row md:items-end"
                    >
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="investment-budget"
                                className="mb-1.5 block text-[12px] font-medium"
                                style={{
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Security Investment Budget
                            </label>

                            <div className="relative">
                                <IndianRupee
                                    size={15}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                                    style={{
                                        color: 'var(--text-tertiary)',
                                    }}
                                />

                                <input
                                    id="investment-budget"
                                    type="number"
                                    min="1"
                                    step="10000"
                                    value={budget}
                                    onChange={(event) =>
                                        setBudget(event.target.value)
                                    }
                                    placeholder="5000000"
                                    className="font-data w-full rounded-md border py-2.5 pl-9 pr-3 text-[13px] outline-none transition-colors"
                                    style={{
                                        borderColor:
                                            'var(--border-hairline)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                    }}
                                    onFocus={(event) => {
                                        event.currentTarget.style.borderColor =
                                            '#A1A1AA'
                                    }}
                                    onBlur={(event) => {
                                        event.currentTarget.style.borderColor =
                                            'var(--border-hairline)'
                                    }}
                                />
                            </div>

                            <p
                                className="mt-1.5 text-[11px]"
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                Enter the maximum amount available for
                                security investment.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[13px] font-medium transition-colors"
                            style={{
                                background: loading
                                    ? 'var(--bg-surface-raised)'
                                    : 'var(--accent-action)',
                                color: loading
                                    ? 'var(--text-tertiary)'
                                    : 'var(--text-inverse)',
                            }}
                        >
                            {loading ? (
                                <RefreshCw
                                    size={15}
                                    className="animate-spin"
                                />
                            ) : (
                                <Calculator size={15} />
                            )}

                            {loading
                                ? 'Optimizing...'
                                : 'Optimize Investment'}
                        </button>
                    </form>

                    {error && (
                        <div className="px-5 pb-5">
                            <div
                                className="flex items-start gap-3 rounded-md border px-4 py-3"
                                style={{
                                    borderColor: '#FECACA',
                                    background:
                                        'var(--status-danger-bg)',
                                }}
                            >
                                <span
                                    className="text-[13px]"
                                    style={{
                                        color:
                                            'var(--status-danger-text)',
                                    }}
                                >
                                    {error}
                                </span>
                            </div>
                        </div>
                    )}
                </section>

                {/* Results */}
                {result && (
                    <>
                        {/* Summary */}
                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            {/* Current EAL */}
                            <div
                                className="rounded-lg border p-4"
                                style={{
                                    borderColor:
                                        'var(--border-hairline)',
                                    background: 'var(--bg-surface)',
                                    boxShadow: 'var(--shadow-sm)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-[12px] font-medium"
                                        style={{
                                            color:
                                                'var(--text-secondary)',
                                        }}
                                    >
                                        Current Annual Loss
                                    </span>

                                    <TrendingDown
                                        size={15}
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    />
                                </div>

                                <div
                                    className="font-data mt-4 text-2xl font-medium leading-none"
                                    style={{
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {formatINR(
                                        result.estimatedAnnualLoss,
                                    )}
                                </div>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Estimated annual risk exposure
                                </p>
                            </div>

                            {/* Recommended investment */}
                            <div
                                className="rounded-lg border p-4"
                                style={{
                                    borderColor:
                                        'var(--border-hairline)',
                                    background: 'var(--bg-surface)',
                                    boxShadow: 'var(--shadow-sm)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-[12px] font-medium"
                                        style={{
                                            color:
                                                'var(--text-secondary)',
                                        }}
                                    >
                                        Recommended Investment
                                    </span>

                                    <Wallet
                                        size={15}
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    />
                                </div>

                                <div
                                    className="font-data mt-4 text-2xl font-medium leading-none"
                                    style={{
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {formatINR(result.totalCost)}
                                </div>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    {formatINR(
                                        result.remainingBudget,
                                    )}{' '}
                                    remaining
                                </p>
                            </div>

                            {/* Risk reduction */}
                            <div
                                className="rounded-lg border p-4"
                                style={{
                                    borderColor:
                                        'var(--border-hairline)',
                                    background: 'var(--bg-surface)',
                                    boxShadow: 'var(--shadow-sm)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-[12px] font-medium"
                                        style={{
                                            color:
                                                'var(--text-secondary)',
                                        }}
                                    >
                                        Risk Reduction
                                    </span>

                                    <ShieldCheck
                                        size={15}
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    />
                                </div>

                                <div
                                    className="font-data mt-4 text-2xl font-medium leading-none"
                                    style={{
                                        color: 'var(--risk-safe)',
                                    }}
                                >
                                    {riskReductionPercent.toFixed(1)}%
                                </div>

                                <div
                                    className="mt-3 h-1.5 overflow-hidden rounded-full"
                                    style={{
                                        background:
                                            'var(--bg-surface-raised)',
                                    }}
                                >
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${Math.min(
                                                Math.max(
                                                    riskReductionPercent,
                                                    0,
                                                ),
                                                100,
                                            )}%`,
                                            background:
                                                'var(--risk-safe)',
                                        }}
                                    />
                                </div>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Combined control effectiveness
                                </p>
                            </div>

                            {/* Risk value protected */}
                            <div
                                className="rounded-lg border p-4"
                                style={{
                                    borderColor:
                                        'var(--border-hairline)',
                                    background: 'var(--bg-surface)',
                                    boxShadow: 'var(--shadow-sm)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-[12px] font-medium"
                                        style={{
                                            color:
                                                'var(--text-secondary)',
                                        }}
                                    >
                                        Risk Value Protected
                                    </span>

                                    <TrendingDown
                                        size={15}
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    />
                                </div>

                                <div
                                    className="font-data mt-4 text-2xl font-medium leading-none"
                                    style={{
                                        color: 'var(--risk-safe)',
                                    }}
                                >
                                    {formatINR(estimatedSavings)}
                                </div>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Estimated annual loss avoided
                                </p>
                            </div>

                            {/* ROSI */}
                            <div
                                className="rounded-lg border p-4"
                                style={{
                                    borderColor:
                                        'var(--border-hairline)',
                                    background: 'var(--bg-surface)',
                                    boxShadow: 'var(--shadow-sm)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-[12px] font-medium"
                                        style={{
                                            color:
                                                'var(--text-secondary)',
                                        }}
                                    >
                                        ROSI
                                    </span>

                                    <Calculator
                                        size={15}
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    />
                                </div>

                                <div
                                    className="font-data mt-4 text-2xl font-medium leading-none"
                                    style={{
                                        color:
                                            result.rosi >= 0
                                                ? 'var(--risk-safe)'
                                                : 'var(--risk-critical)',
                                    }}
                                >
                                    {(result.rosi * 100).toFixed(1)}%
                                </div>

                                <span
                                    className="mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-medium"
                                    style={getRosiStyle(result.rosi)}
                                >
                                    {result.rosi >= 0
                                        ? 'Positive return'
                                        : 'Negative return'}
                                </span>
                            </div>
                        </div>

                        {/* Recommended controls */}
                        <section
                            className="mt-6 overflow-hidden rounded-lg border"
                            style={{
                                borderColor:
                                    'var(--border-hairline)',
                                background: 'var(--bg-surface)',
                                boxShadow: 'var(--shadow-sm)',
                            }}
                        >
                            <div
                                className="border-b px-5 py-4"
                                style={{
                                    borderColor:
                                        'var(--border-hairline-soft)',
                                }}
                            >
                                <h2
                                    className="text-sm font-semibold"
                                    style={{
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    Recommended Security Controls
                                </h2>

                                <p
                                    className="mt-0.5 text-[11px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Controls selected by the investment
                                    optimization engine.
                                </p>
                            </div>

                            {result.recommendedControls.length ===
                                0 ? (
                                <div className="px-6 py-14 text-center">
                                    <div
                                        className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border"
                                        style={{
                                            borderColor:
                                                'var(--border-hairline)',
                                            background:
                                                'var(--bg-base)',
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    >
                                        <Wallet size={17} />
                                    </div>

                                    <h3
                                        className="mt-3 text-sm font-medium"
                                        style={{
                                            color:
                                                'var(--text-primary)',
                                        }}
                                    >
                                        No controls selected
                                    </h3>

                                    <p
                                        className="mx-auto mt-1 max-w-sm text-[12px]"
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    >
                                        No available controls can be
                                        selected within the specified
                                        budget.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[760px] text-left">
                                        <thead
                                            className="border-b"
                                            style={{
                                                borderColor:
                                                    'var(--border-hairline-soft)',
                                                background:
                                                    'var(--bg-base)',
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
                                                    Control
                                                </th>

                                                <th
                                                    className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                                    style={{
                                                        color:
                                                            'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Category
                                                </th>

                                                <th
                                                    className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                                    style={{
                                                        color:
                                                            'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Cost
                                                </th>

                                                <th
                                                    className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                                    style={{
                                                        color:
                                                            'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Risk Reduction
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {result.recommendedControls.map(
                                                (control) => (
                                                    <tr
                                                        key={control.id}
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
                                                        <td className="px-5 py-4">
                                                            <div>
                                                                <div
                                                                    className="text-[13px] font-medium"
                                                                    style={{
                                                                        color:
                                                                            'var(--text-primary)',
                                                                    }}
                                                                >
                                                                    {control.name}
                                                                </div>

                                                                <div
                                                                    className="font-data mt-0.5 text-[10px]"
                                                                    style={{
                                                                        color:
                                                                            'var(--text-tertiary)',
                                                                    }}
                                                                >
                                                                    {control.id}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td
                                                            className="px-5 py-4 text-[12px]"
                                                            style={{
                                                                color:
                                                                    'var(--text-secondary)',
                                                            }}
                                                        >
                                                            {control.category}
                                                        </td>

                                                        <td
                                                            className="font-data px-5 py-4 text-[12px]"
                                                            style={{
                                                                color:
                                                                    'var(--text-primary)',
                                                            }}
                                                        >
                                                            {formatINR(
                                                                control.cost,
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2.5">
                                                                <div
                                                                    className="h-1.5 w-20 overflow-hidden rounded-full"
                                                                    style={{
                                                                        background:
                                                                            'var(--bg-surface-raised)',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            width: `${Math.min(
                                                                                Math.max(
                                                                                    control.riskReductionPct *
                                                                                    100,
                                                                                    0,
                                                                                ),
                                                                                100,
                                                                            )}%`,
                                                                            background:
                                                                                'var(--risk-safe)',
                                                                        }}
                                                                    />
                                                                </div>

                                                                <span
                                                                    className="font-data text-[11px] font-medium"
                                                                    style={{
                                                                        color:
                                                                            'var(--risk-safe)',
                                                                    }}
                                                                >
                                                                    {(
                                                                        control.riskReductionPct *
                                                                        100
                                                                    ).toFixed(1)}
                                                                    %
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Totals */}
                            <div
                                className="grid gap-4 border-t px-5 py-4 sm:grid-cols-2"
                                style={{
                                    borderColor:
                                        'var(--border-hairline-soft)',
                                }}
                            >
                                <div>
                                    <p
                                        className="text-[11px]"
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    >
                                        Total recommended investment
                                    </p>

                                    <p
                                        className="font-data mt-1 text-lg font-medium"
                                        style={{
                                            color:
                                                'var(--text-primary)',
                                        }}
                                    >
                                        {formatINR(result.totalCost)}
                                    </p>
                                </div>

                                <div className="sm:text-right">
                                    <p
                                        className="text-[11px]"
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    >
                                        Remaining budget
                                    </p>

                                    <p
                                        className="font-data mt-1 text-lg font-medium"
                                        style={{
                                            color:
                                                'var(--risk-safe)',
                                        }}
                                    >
                                        {formatINR(
                                            result.remainingBudget,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    )
}