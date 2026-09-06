import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
    Calculator,
    CheckCircle2,
    IndianRupee,
    RefreshCw,
    ShieldCheck,
    TrendingDown,
    Wallet,
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

function SummaryCard({
    label,
    value,
    helper,
    icon,
    valueClassName = '',
}: {
    label: string
    value: string
    helper?: ReactNode
    icon: ReactNode
    valueClassName?: string
}) {
    return (
        <article className="panel-soft min-w-0 p-5">
            <div className="flex items-start justify-between gap-3">
                <span
                    className="text-xs font-semibold uppercase tracking-[0.08em]"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    {label}
                </span>

                <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center border"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-base)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    {icon}
                </span>
            </div>

            <div
                className={`stat-value mt-5 text-2xl leading-none ${valueClassName}`}
                style={{ color: 'var(--text-primary)' }}
            >
                {value}
            </div>

            {helper && (
                <div
                    className="mt-3 text-xs leading-5"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    {helper}
                </div>
            )}
        </article>
    )
}

export default function Optimizer() {
    const [budget, setBudget] = useState('5000000')
    const [result, setResult] = useState<OptimizerResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleOptimize(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const numericBudget = Number(budget)

        if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
            setError('Please enter a valid budget greater than 0.')
            return
        }

        try {
            setLoading(true)
            setError('')

            const data = await optimizeInvestment(numericBudget)
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
        ? result.estimatedAnnualLoss * result.totalRiskReductionPct
        : 0

    const boundedReduction = Math.min(
        Math.max(riskReductionPercent, 0),
        100,
    )

    return (
        <div
            className="min-h-screen"
            style={{ background: 'var(--bg-base)' }}
        >
            <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-7 lg:px-8">
                {/* Page header */}
                <header className="mb-8">
                    <div className="flex flex-wrap items-center gap-3">
                        <span
                            className="flex h-9 w-9 items-center justify-center border-2"
                            style={{
                                borderColor: 'var(--border-strong)',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <Wallet size={17} strokeWidth={2} />
                        </span>

                        <div>
                            <p
                                className="font-data text-[10px] font-semibold uppercase tracking-[0.14em]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Security investment
                            </p>

                            <h1
                                className="mt-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Investment Optimizer
                            </h1>
                        </div>
                    </div>

                    <p
                        className="mt-3 max-w-2xl text-sm leading-6"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Find the strongest combination of security controls
                        within a fixed investment budget.
                    </p>
                </header>

                {/* Budget configuration */}
                <section className="panel overflow-hidden">
                    <div
                        className="flex flex-col gap-3 border-b-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                        style={{
                            borderColor: 'var(--border-strong)',
                            background: 'var(--bg-surface)',
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <span
                                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border"
                                style={{
                                    borderColor: 'var(--border-hairline)',
                                    background: 'var(--bg-base)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <Calculator size={15} />
                            </span>

                            <div>
                                <h2
                                    className="text-sm font-bold"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    Set investment budget
                                </h2>

                                <p
                                    className="mt-1 text-xs leading-5"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    The optimizer selects controls that
                                    maximize risk reduction within this limit.
                                </p>
                            </div>
                        </div>

                        <span
                            className="self-start border px-2.5 py-1 font-data text-[10px] font-semibold uppercase tracking-wide"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-base)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            Optimization engine
                        </span>
                    </div>

                    <form
                        onSubmit={handleOptimize}
                        className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-end"
                    >
                        <div>
                            <label
                                htmlFor="investment-budget"
                                className="mb-2 block text-xs font-bold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Security Investment Budget
                            </label>

                            <div className="relative">
                                <IndianRupee
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                                    style={{
                                        color: 'var(--text-secondary)',
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
                                    aria-describedby="budget-help"
                                    className="font-data w-full border-2 py-3 pl-10 pr-3 text-sm outline-none transition-colors"
                                    style={{
                                        borderColor: 'var(--border-strong)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                    }}
                                    onFocus={(event) => {
                                        event.currentTarget.style.background =
                                            'var(--bg-surface-hover)'
                                    }}
                                    onBlur={(event) => {
                                        event.currentTarget.style.background =
                                            'var(--bg-surface)'
                                    }}
                                />
                            </div>

                            <p
                                id="budget-help"
                                className="mt-2 text-xs"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Maximum amount available for security
                                investment.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex min-h-11 items-center justify-center gap-2 border-2 px-5 text-sm font-bold transition-all"
                            style={{
                                borderColor: 'var(--border-strong)',
                                background: loading
                                    ? 'var(--bg-surface-raised)'
                                    : 'var(--accent-action)',
                                color: loading
                                    ? 'var(--text-tertiary)'
                                    : 'var(--text-inverse)',
                                cursor: loading ? 'wait' : 'pointer',
                            }}
                        >
                            {loading ? (
                                <RefreshCw
                                    size={16}
                                    className="animate-spin"
                                />
                            ) : (
                                <Calculator size={16} />
                            )}

                            {loading ? 'Optimizing...' : 'Optimize Investment'}
                        </button>
                    </form>

                    {error && (
                        <div className="border-t-2 p-5" style={{ borderColor: 'var(--border-strong)' }}>
                            <div
                                className="flex items-start gap-3 border px-4 py-3"
                                style={{
                                    borderColor: '#FECACA',
                                    background: 'var(--status-danger-bg)',
                                    color: 'var(--status-danger-text)',
                                }}
                                role="alert"
                            >
                                <span className="text-sm font-semibold">
                                    Optimization failed.
                                </span>
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}
                </section>

                {/* Results */}
                {result && (
                    <section className="mt-8">
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p
                                    className="font-data text-[10px] font-semibold uppercase tracking-[0.12em]"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Optimization result
                                </p>
                                <h2
                                    className="mt-1 text-lg font-extrabold"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    Recommended security investment
                                </h2>
                            </div>

                            <div
                                className="flex items-center gap-2 border px-3 py-2 text-xs font-semibold"
                                style={{
                                    borderColor: 'var(--border-hairline)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--status-success-text)',
                                }}
                            >
                                <CheckCircle2 size={14} />
                                Calculation complete
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <SummaryCard
                                label="Current annual loss"
                                value={formatINR(result.estimatedAnnualLoss)}
                                helper="Estimated annual risk exposure"
                                icon={<TrendingDown size={15} />}
                            />

                            <SummaryCard
                                label="Recommended investment"
                                value={formatINR(result.totalCost)}
                                helper={`${formatINR(result.remainingBudget)} remaining`}
                                icon={<Wallet size={15} />}
                            />

                            <SummaryCard
                                label="Risk reduction"
                                value={`${riskReductionPercent.toFixed(1)}%`}
                                helper="Combined control effectiveness"
                                icon={<ShieldCheck size={15} />}
                                valueClassName="!text-[var(--risk-safe)]"
                            />

                            <SummaryCard
                                label="Risk value protected"
                                value={formatINR(estimatedSavings)}
                                helper="Estimated annual loss avoided"
                                icon={<TrendingDown size={15} />}
                                valueClassName="!text-[var(--risk-safe)]"
                            />

                            <SummaryCard
                                label="ROSI"
                                value={`${(result.rosi * 100).toFixed(1)}%`}
                                helper={
                                    <span
                                        className="inline-flex border px-2 py-1 text-[10px] font-bold"
                                        style={getRosiStyle(result.rosi)}
                                    >
                                        {result.rosi >= 0
                                            ? 'Positive return'
                                            : 'Negative return'}
                                    </span>
                                }
                                icon={<Calculator size={15} />}
                                valueClassName={
                                    result.rosi >= 0
                                        ? '!text-[var(--risk-safe)]'
                                        : '!text-[var(--risk-critical)]'
                                }
                            />
                        </div>

                        {/* Risk reduction visual */}
                        <div className="panel-soft mt-4 p-5">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <p
                                        className="text-xs font-bold"
                                        style={{
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        Portfolio risk reduction
                                    </p>
                                    <p
                                        className="mt-1 text-xs"
                                        style={{
                                            color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        Estimated impact of the recommended
                                        control set.
                                    </p>
                                </div>

                                <span
                                    className="font-data text-sm font-bold"
                                    style={{ color: 'var(--risk-safe)' }}
                                >
                                    {riskReductionPercent.toFixed(1)}%
                                </span>
                            </div>

                            <div
                                className="mt-4 h-3 border"
                                style={{
                                    borderColor: 'var(--border-hairline)',
                                    background: 'var(--bg-surface-raised)',
                                }}
                                aria-label={`${riskReductionPercent.toFixed(1)} percent risk reduction`}
                            >
                                <div
                                    className="h-full"
                                    style={{
                                        width: `${boundedReduction}%`,
                                        background: 'var(--risk-safe)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Recommended controls */}
                        <section className="panel mt-6 overflow-hidden">
                            <div
                                className="border-b-2 px-5 py-5"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-surface)',
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className="flex h-8 w-8 shrink-0 items-center justify-center border"
                                        style={{
                                            borderColor:
                                                'var(--border-hairline)',
                                            background: 'var(--bg-base)',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        <ShieldCheck size={15} />
                                    </span>

                                    <div>
                                        <h2
                                            className="text-sm font-bold"
                                            style={{
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            Recommended Security Controls
                                        </h2>
                                        <p
                                            className="mt-1 text-xs leading-5"
                                            style={{
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            Controls selected by the
                                            investment optimization engine.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {result.recommendedControls.length === 0 ? (
                                <div className="px-6 py-16 text-center">
                                    <div
                                        className="mx-auto flex h-11 w-11 items-center justify-center border"
                                        style={{
                                            borderColor:
                                                'var(--border-hairline)',
                                            background: 'var(--bg-base)',
                                            color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        <Wallet size={18} />
                                    </div>

                                    <h3
                                        className="mt-4 text-sm font-bold"
                                        style={{
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        No controls selected
                                    </h3>

                                    <p
                                        className="mx-auto mt-1 max-w-md text-xs leading-5"
                                        style={{
                                            color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        No available controls can be selected
                                        within the specified budget.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[720px] text-left">
                                        <thead
                                            className="border-b"
                                            style={{
                                                borderColor:
                                                    'var(--border-hairline)',
                                                background: 'var(--bg-base)',
                                            }}
                                        >
                                            <tr>
                                                <th
                                                    className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em]"
                                                    style={{
                                                        color: 'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Control
                                                </th>
                                                <th
                                                    className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em]"
                                                    style={{
                                                        color: 'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Category
                                                </th>
                                                <th
                                                    className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em]"
                                                    style={{
                                                        color: 'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Cost
                                                </th>
                                                <th
                                                    className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em]"
                                                    style={{
                                                        color: 'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Risk reduction
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {result.recommendedControls.map(
                                                (control) => (
                                                    <tr
                                                        key={control.id}
                                                        className="border-b last:border-0"
                                                        style={{
                                                            borderColor:
                                                                'var(--border-hairline-soft)',
                                                        }}
                                                        onMouseEnter={(
                                                            event,
                                                        ) => {
                                                            event.currentTarget.style.background =
                                                                'var(--bg-surface-hover)'
                                                        }}
                                                        onMouseLeave={(
                                                            event,
                                                        ) => {
                                                            event.currentTarget.style.background =
                                                                'transparent'
                                                        }}
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div>
                                                                <div
                                                                    className="text-sm font-bold"
                                                                    style={{
                                                                        color: 'var(--text-primary)',
                                                                    }}
                                                                >
                                                                    {
                                                                        control.name
                                                                    }
                                                                </div>
                                                                <div
                                                                    className="font-data mt-1 text-[10px]"
                                                                    style={{
                                                                        color: 'var(--text-tertiary)',
                                                                    }}
                                                                >
                                                                    {control.id}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td
                                                            className="px-5 py-4 text-xs"
                                                            style={{
                                                                color: 'var(--text-secondary)',
                                                            }}
                                                        >
                                                            {control.category}
                                                        </td>

                                                        <td
                                                            className="font-data px-5 py-4 text-xs font-semibold"
                                                            style={{
                                                                color: 'var(--text-primary)',
                                                            }}
                                                        >
                                                            {formatINR(
                                                                control.cost,
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="h-2 w-24 border"
                                                                    style={{
                                                                        borderColor:
                                                                            'var(--border-hairline)',
                                                                        background:
                                                                            'var(--bg-surface-raised)',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="h-full"
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
                                                                    className="font-data text-xs font-bold"
                                                                    style={{
                                                                        color: 'var(--risk-safe)',
                                                                    }}
                                                                >
                                                                    {(
                                                                        control.riskReductionPct *
                                                                        100
                                                                    ).toFixed(
                                                                        1,
                                                                    )}
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

                            <div
                                className="grid gap-5 border-t-2 px-5 py-5 sm:grid-cols-2"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-base)',
                                }}
                            >
                                <div>
                                    <p
                                        className="text-[10px] font-bold uppercase tracking-[0.08em]"
                                        style={{
                                            color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        Total recommended investment
                                    </p>
                                    <p
                                        className="stat-value mt-1 text-lg"
                                        style={{
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        {formatINR(result.totalCost)}
                                    </p>
                                </div>

                                <div className="sm:text-right">
                                    <p
                                        className="text-[10px] font-bold uppercase tracking-[0.08em]"
                                        style={{
                                            color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        Remaining budget
                                    </p>
                                    <p
                                        className="stat-value mt-1 text-lg"
                                        style={{
                                            color: 'var(--risk-safe)',
                                        }}
                                    >
                                        {formatINR(result.remainingBudget)}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </section>
                )}
            </main>
        </div>
    )
}
