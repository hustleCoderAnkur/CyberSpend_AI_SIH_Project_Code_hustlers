import {  useState } from 'react'
import type { FormEvent } from 'react'
import {
    Wallet,
    Calculator,
    ShieldCheck,
    TrendingDown,
    IndianRupee,
} from 'lucide-react'

import { optimizeInvestment } from '../api/optimizer'
import type { OptimizerResult } from '../api/optimizer'
import { formatINR } from '../lib/format'

export default function Optimizer() {
    const [budget, setBudget] = useState('5000000')
    const [result, setResult] = useState<OptimizerResult | null>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleOptimize(event: FormEvent) {
        event.preventDefault()

        const numericBudget = Number(budget)

        if (!numericBudget || numericBudget <= 0) {
            setError('Please enter a valid budget.')
            return
        }

        try {
            setLoading(true)
            setError('')

            const data = await optimizeInvestment(numericBudget)

            setResult(data)
        } catch (err) {
            console.error(err)
            setError('Failed to calculate the recommended investment.')
        } finally {
            setLoading(false)
        }
    }

    const riskReductionPercent =
        result ? result.totalRiskReductionPct * 100 : 0

    const estimatedSavings =
        result
            ? result.estimatedAnnualLoss * result.totalRiskReductionPct
            : 0

    return (
        <div className="p-6">

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <Wallet
                        size={18}
                        style={{ color: 'var(--accent-action)' }}
                    />

                    <h1
                        className="text-xl font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Investment Optimizer
                    </h1>
                </div>

                <p
                    className="mt-1 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Find the best combination of security controls within a fixed budget.
                </p>
            </div>

            {/* Budget Input */}
            <div
                className="rounded-lg border p-5"
                style={{
                    borderColor: 'var(--border-hairline)',
                    background: 'var(--bg-surface)',
                }}
            >
                <form
                    onSubmit={handleOptimize}
                    className="flex flex-col gap-4 md:flex-row md:items-end"
                >
                    <div className="flex-1">
                        <label
                            className="mb-2 block text-xs font-medium"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Security Investment Budget
                        </label>

                        <div className="relative">
                            <IndianRupee
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--text-tertiary)' }}
                            />

                            <input
                                type="number"
                                step="10000"
                                onChange={(event) => setBudget(event.target.value)}
                                placeholder="Enter your optimization number here"
                                className="w-full rounded-md border py-2.5 pl-9 pr-3 text-sm outline-none"
                                style={{
                                    borderColor: 'var(--border-hairline)',
                                    background: 'var(--bg-base)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </div>

                        <p
                            className="mt-1.5 text-[11px]"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            Enter the maximum amount available for security investment.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                            background: 'var(--accent-action)',
                            color: '#0A0F1C',
                        }}
                    >
                        <Calculator size={16} />

                        {loading ? 'Optimizing...' : 'Optimize Investment'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}
            </div>

            {/* Results */}
            {result && (
                <>
                    {/* Summary */}
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

                        {/* Current EAL */}
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
                                    Current Annual Loss
                                </span>

                                <TrendingDown
                                    size={16}
                                    style={{ color: 'var(--text-tertiary)' }}
                                />
                            </div>

                            <div
                                className="text-2xl font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {formatINR(result.estimatedAnnualLoss)}
                            </div>

                            <p
                                className="mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Estimated annual risk exposure
                            </p>
                        </div>

                        {/* Recommended Investment */}
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
                                    Recommended Investment
                                </span>

                                <Wallet
                                    size={16}
                                    style={{ color: 'var(--text-tertiary)' }}
                                />
                            </div>

                            <div
                                className="text-2xl font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {formatINR(result.totalCost)}
                            </div>

                            <p
                                className="mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                {formatINR(result.remainingBudget)} remaining
                            </p>
                        </div>

                        {/* Risk Reduction */}
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
                                    Risk Reduction
                                </span>

                                <ShieldCheck
                                    size={16}
                                    style={{ color: 'var(--text-tertiary)' }}
                                />
                            </div>

                            <div className="text-2xl font-semibold text-emerald-400">
                                {riskReductionPercent.toFixed(1)}%
                            </div>

                            <p
                                className="mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Combined control effectiveness
                            </p>
                        </div>

                        {/* Risk Reduction Value */}
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
                                    Risk Value Protected
                                </span>

                                <TrendingDown
                                    size={16}
                                    style={{ color: 'var(--text-tertiary)' }}
                                />
                            </div>

                            <div className="text-2xl font-semibold text-emerald-400">
                                {formatINR(estimatedSavings)}
                            </div>

                            <p
                                className="mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Estimated annual loss avoided
                            </p>
                        </div>

                        {/* ROSI */}
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
                                    ROSI
                                </span>

                                <Calculator
                                    size={16}
                                    style={{ color: 'var(--text-tertiary)' }}
                                />
                            </div>

                            <div
                                className={`text-2xl font-semibold ${result.rosi >= 0
                                        ? 'text-emerald-400'
                                        : 'text-red-400'
                                    }`}
                            >
                                {(result.rosi * 100).toFixed(1)}%
                            </div>

                            <p
                                className="mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Return on Security Investment
                            </p>
                        </div>
                    </div>

                    {/* Recommended Controls */}
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
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Recommended Security Controls
                            </h2>

                            <p
                                className="mt-1 text-xs"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Controls selected by the investment optimization engine.
                            </p>
                        </div>

                        {result.recommendedControls.length === 0 ? (
                            <div
                                className="px-5 py-10 text-center text-sm"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                No controls can be selected within this budget.
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
                                                Control
                                            </th>

                                            <th className="px-5 py-3 font-medium">
                                                Category
                                            </th>

                                            <th className="px-5 py-3 font-medium">
                                                Cost
                                            </th>

                                            <th className="px-5 py-3 font-medium">
                                                Risk Reduction
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {result.recommendedControls.map((control) => (
                                            <tr
                                                key={control.id}
                                                className="border-b last:border-b-0"
                                                style={{
                                                    borderColor:
                                                        'var(--border-hairline-soft)',
                                                }}
                                            >
                                                <td className="px-5 py-4">
                                                    <div
                                                        className="text-sm font-medium"
                                                        style={{
                                                            color: 'var(--text-primary)',
                                                        }}
                                                    >
                                                        {control.name}
                                                    </div>

                                                    <div
                                                        className="mt-0.5 text-xs"
                                                        style={{
                                                            color: 'var(--text-tertiary)',
                                                        }}
                                                    >
                                                        {control.id}
                                                    </div>
                                                </td>

                                                <td
                                                    className="px-5 py-4 text-sm"
                                                    style={{
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {control.category}
                                                </td>

                                                <td
                                                    className="px-5 py-4 text-sm"
                                                    style={{
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {formatINR(control.cost)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="text-sm font-medium text-emerald-400">
                                                        {(control.riskReductionPct * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Total */}
                        <div
                            className="flex flex-col gap-2 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                            style={{
                                borderColor: 'var(--border-hairline)',
                            }}
                        >
                            <div>
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Total recommended investment
                                </p>

                                <p
                                    className="text-lg font-semibold"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {formatINR(result.totalCost)}
                                </p>
                            </div>

                            <div className="text-left md:text-right">
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Remaining budget
                                </p>

                                <p className="text-lg font-semibold text-emerald-400">
                                    {formatINR(result.remainingBudget)}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}