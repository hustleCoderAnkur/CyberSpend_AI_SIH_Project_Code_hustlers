import { useEffect, useState } from 'react'
import {
    SlidersHorizontal,
    ShieldCheck,
} from 'lucide-react'

import { getControls } from '../api/controls'
import { simulateWhatIf } from '../api/whatIf'
import type { WhatIfResult } from '../api/whatIf'
import type { Control } from '../types'
import { formatINR } from '../lib/format'

export default function WhatIf() {
    const [controls, setControls] = useState<Control[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const [result, setResult] = useState<WhatIfResult | null>(null)

    const [loadingControls, setLoadingControls] = useState(true)
    const [loadingSimulation, setLoadingSimulation] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadControls() {
            try {
                setLoadingControls(true)
                setError('')

                const data = await getControls()

                setControls(data)
            } catch (err) {
                console.error(err)
                setError('Failed to load security controls.')
            } finally {
                setLoadingControls(false)
            }
        }

        loadControls()
    }, [])

    function toggleControl(id: string) {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((controlId) => controlId !== id)
                : [...current, id],
        )
    }

    async function handleSimulate() {
        try {
            setLoadingSimulation(true)
            setError('')

            const data = await simulateWhatIf(selectedIds)

            setResult(data)
        } catch (err) {
            console.error(err)
            setError('Failed to simulate the selected controls.')
        } finally {
            setLoadingSimulation(false)
        }
    }

    const riskReduction =
        result && result.beforeEal > 0
            ? ((result.beforeEal - result.afterEal) / result.beforeEal) * 100
            : 0

    return (
        <div className="p-6">

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal
                        size={18}
                        style={{ color: 'var(--accent-action)' }}
                    />

                    <h1
                        className="text-xl font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        What If Simulator
                    </h1>
                </div>

                <p
                    className="mt-1 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Simulate the financial impact of applying different security controls.
                </p>
            </div>

            {/* Control Selection */}
            <div
                className="rounded-lg border p-5"
                style={{
                    borderColor: 'var(--border-hairline)',
                    background: 'var(--bg-surface)',
                }}
            >
                <div className="mb-4">
                    <h2
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Select Security Controls
                    </h2>

                    <p
                        className="mt-1 text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        Choose the controls you want to simulate.
                    </p>
                </div>

                {loadingControls ? (
                    <p
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Loading controls...
                    </p>
                ) : controls.length === 0 ? (
                    <p
                        className="text-sm"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        No security controls available.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {controls.map((control) => {
                            const selected = selectedIds.includes(control.id)

                            return (
                                <button
                                    key={control.id}
                                    type="button"
                                    onClick={() => toggleControl(control.id)}
                                    className="rounded-md border p-4 text-left transition-colors"
                                    style={{
                                        borderColor: selected
                                            ? 'var(--accent-action)'
                                            : 'var(--border-hairline)',
                                        background: selected
                                            ? 'var(--bg-surface-raised)'
                                            : 'var(--bg-base)',
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p
                                                className="text-sm font-medium"
                                                style={{
                                                    color: 'var(--text-primary)',
                                                }}
                                            >
                                                {control.name}
                                            </p>

                                            <p
                                                className="mt-1 text-xs"
                                                style={{
                                                    color: 'var(--text-tertiary)',
                                                }}
                                            >
                                                {control.category}
                                            </p>
                                        </div>

                                        <div
                                            className="flex h-5 w-5 items-center justify-center rounded border"
                                            style={{
                                                borderColor: selected
                                                    ? 'var(--accent-action)'
                                                    : 'var(--border-hairline)',
                                                background: selected
                                                    ? 'var(--accent-action)'
                                                    : 'transparent',
                                            }}
                                        >
                                            {selected && (
                                                <span
                                                    className="text-xs font-bold"
                                                    style={{ color: '#0A0F1C' }}
                                                >
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <span
                                            className="text-xs"
                                            style={{
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            Cost
                                        </span>

                                        <span
                                            className="text-xs font-medium"
                                            style={{
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {formatINR(control.cost)}
                                        </span>
                                    </div>

                                    <div className="mt-1 flex items-center justify-between">
                                        <span
                                            className="text-xs"
                                            style={{
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            Risk Reduction
                                        </span>

                                        <span className="text-xs font-medium text-emerald-400">
                                            {(control.riskReductionPct * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}

                <div className="mt-5 flex items-center justify-between">
                    <p
                        className="text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        {selectedIds.length} control
                        {selectedIds.length === 1 ? '' : 's'} selected
                    </p>

                    <button
                        type="button"
                        onClick={handleSimulate}
                        disabled={loadingSimulation}
                        className="flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                            background: 'var(--accent-action)',
                            color: '#0A0F1C',
                        }}
                    >
                        <SlidersHorizontal size={16} />

                        {loadingSimulation
                            ? 'Simulating...'
                            : 'Run Simulation'}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}
            </div>

            {/* Results */}
            {result && (
                <>
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

                        {/* Before */}
                        <div
                            className="rounded-lg border p-4"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-surface)',
                            }}
                        >
                            <p
                                className="text-xs"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                EAL Before
                            </p>

                            <p
                                className="mt-3 text-2xl font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {formatINR(result.beforeEal)}
                            </p>

                            <p
                                className="mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Current estimated annual loss
                            </p>
                        </div>

                        {/* After */}
                        <div
                            className="rounded-lg border p-4"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-surface)',
                            }}
                        >
                            <p
                                className="text-xs"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                EAL After
                            </p>

                            <p className="mt-3 text-2xl font-semibold text-emerald-400">
                                {formatINR(result.afterEal)}
                            </p>

                            <p
                                className="mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Projected annual loss
                            </p>
                        </div>

                        {/* Savings */}
                        <div
                            className="rounded-lg border p-4"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-surface)',
                            }}
                        >
                            <p
                                className="text-xs"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Annual Savings
                            </p>

                            <p className="mt-3 text-2xl font-semibold text-emerald-400">
                                {formatINR(result.savings)}
                            </p>

                            <p
                                className="mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Estimated loss avoided
                            </p>
                        </div>

                        {/* Investment */}
                        <div
                            className="rounded-lg border p-4"
                            style={{
                                borderColor: 'var(--border-hairline)',
                                background: 'var(--bg-surface)',
                            }}
                        >
                            <p
                                className="text-xs"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Control Investment
                            </p>

                            <p
                                className="mt-3 text-2xl font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {formatINR(result.totalCost)}
                            </p>

                            <p
                                className="mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Total control cost
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
                            <p
                                className="text-xs"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Risk Reduction
                            </p>

                            <p className="mt-3 text-2xl font-semibold text-emerald-400">
                                {riskReduction.toFixed(1)}%
                            </p>

                            <p
                                className="mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Based on EAL improvement
                            </p>
                        </div>
                    </div>

                    {/* Result Details */}
                    <div
                        className="mt-6 rounded-lg border p-5"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck
                                size={17}
                                style={{ color: 'var(--accent-action)' }}
                            />

                            <h2
                                className="text-sm font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Simulation Result
                            </h2>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">

                            <div>
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Selected Controls
                                </p>

                                <p
                                    className="mt-1 text-sm font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {result.selectedControls.length}
                                </p>
                            </div>

                            <div>
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    ROSI
                                </p>

                                <p
                                    className={`mt-1 text-sm font-semibold ${result.rosi >= 0
                                            ? 'text-emerald-400'
                                            : 'text-red-400'
                                        }`}
                                >
                                    {(result.rosi * 100).toFixed(1)}%
                                </p>
                            </div>

                            <div>
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Net Financial Benefit
                                </p>

                                <p
                                    className={`mt-1 text-sm font-semibold ${result.savings - result.totalCost >= 0
                                            ? 'text-emerald-400'
                                            : 'text-red-400'
                                        }`}
                                >
                                    {formatINR(
                                        result.savings - result.totalCost,
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5">
                            <p
                                className="mb-3 text-xs font-medium"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Selected Controls
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {result.selectedControls.map((control) => (
                                    <span
                                        key={control.id}
                                        className="rounded-md border px-3 py-1.5 text-xs"
                                        style={{
                                            borderColor: 'var(--border-hairline)',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        {control.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    )
}