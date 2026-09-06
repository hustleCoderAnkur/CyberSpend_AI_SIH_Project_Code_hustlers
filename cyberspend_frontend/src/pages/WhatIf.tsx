import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    SlidersHorizontal,
    ShieldCheck,
    RefreshCw,
    Check,
    TrendingDown,
    Wallet,
} from 'lucide-react'

import { getControls } from '../api/controls'
import { simulateWhatIf } from '../api/whatIf'
import type { WhatIfResult } from '../api/whatIf'
import type { Control } from '../types'
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

function getRiskReductionColor(value: number) {
    if (value >= 40) return 'var(--risk-safe)'
    if (value >= 25) return 'var(--risk-medium)'
    return 'var(--risk-high)'
}

export default function WhatIf() {
    const [controls, setControls] = useState<Control[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const [result, setResult] =
        useState<WhatIfResult | null>(null)

    const [loadingControls, setLoadingControls] =
        useState(true)

    const [loadingSimulation, setLoadingSimulation] =
        useState(false)

    const [error, setError] = useState('')

    const loadControls = useCallback(async () => {
        try {
            setLoadingControls(true)
            setError('')

            const data = await getControls()
            setControls(data)
        } catch (err) {
            console.error(err)
            setError(
                'Failed to load security controls. Please try again.',
            )
        } finally {
            setLoadingControls(false)
        }
    }, [])

    useEffect(() => {
        loadControls()
    }, [loadControls])

    function toggleControl(id: string) {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter(
                    (controlId) => controlId !== id,
                )
                : [...current, id],
        )

        setResult(null)
    }

    async function handleSimulate() {
        if (selectedIds.length === 0) {
            setError(
                'Select at least one security control before running the simulation.',
            )
            return
        }

        try {
            setLoadingSimulation(true)
            setError('')

            const data =
                await simulateWhatIf(selectedIds)

            setResult(data)
        } catch (err) {
            console.error(err)
            setError(
                'Failed to simulate the selected controls. Please try again.',
            )
        } finally {
            setLoadingSimulation(false)
        }
    }

    const riskReduction = useMemo(() => {
        if (!result || result.beforeEal <= 0) {
            return 0
        }

        return (
            ((result.beforeEal - result.afterEal) /
                result.beforeEal) *
            100
        )
    }, [result])

    const selectedInvestment = useMemo(() => {
        return controls
            .filter((control) =>
                selectedIds.includes(control.id),
            )
            .reduce(
                (total, control) => total + control.cost,
                0,
            )
    }, [controls, selectedIds])

    return (
        <div
            className="min-h-screen"
            style={{ background: 'var(--bg-base)' }}
        >
            <div className="mx-auto w-full max-w-7xl px-6 py-7 lg:px-8">
                {/* Header */}
                <header>
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal
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
                            What If Simulator
                        </h1>
                    </div>

                    <p
                        className="mt-1 text-sm"
                        style={{
                            color: 'var(--text-secondary)',
                        }}
                    >
                        Simulate how different security controls could
                        change your financial risk exposure.
                    </p>
                </header>

                {/* Control selection */}
                <section
                    className="mt-6 overflow-hidden rounded-lg border"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    <div
                        className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
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
                                Select Security Controls
                            </h2>

                            <p
                                className="mt-0.5 text-[11px]"
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                Choose the controls you want to simulate.
                            </p>
                        </div>

                        <div
                            className="font-data text-[11px]"
                            style={{
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            {selectedIds.length} selected
                        </div>
                    </div>

                    <div className="p-5">
                        {loadingControls ? (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 6 }).map(
                                    (_, index) => (
                                        <div
                                            key={index}
                                            className="h-36 animate-pulse rounded-lg border"
                                            style={{
                                                borderColor:
                                                    'var(--border-hairline)',
                                                background:
                                                    'var(--bg-base)',
                                            }}
                                        />
                                    ),
                                )}
                            </div>
                        ) : controls.length === 0 ? (
                            <div className="py-12 text-center">
                                <div
                                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border"
                                    style={{
                                        borderColor:
                                            'var(--border-hairline)',
                                        background: 'var(--bg-base)',
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    <ShieldCheck size={17} />
                                </div>

                                <h3
                                    className="mt-3 text-sm font-medium"
                                    style={{
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    No security controls available
                                </h3>

                                <p
                                    className="mt-1 text-[12px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Import or create controls before running
                                    a simulation.
                                </p>

                                <button
                                    type="button"
                                    onClick={loadControls}
                                    className="mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] font-medium"
                                    style={{
                                        borderColor:
                                            'var(--border-hairline)',
                                        background:
                                            'var(--bg-surface)',
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    <RefreshCw size={13} />
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {controls.map((control) => {
                                    const selected =
                                        selectedIds.includes(control.id)

                                    const reduction =
                                        control.riskReductionPct * 100

                                    const reductionColor =
                                        getRiskReductionColor(
                                            reduction,
                                        )

                                    return (
                                        <button
                                            key={control.id}
                                            type="button"
                                            onClick={() =>
                                                toggleControl(control.id)
                                            }
                                            aria-pressed={selected}
                                            className="group rounded-lg border p-4 text-left transition-colors duration-150"
                                            style={{
                                                borderColor: selected
                                                    ? 'var(--text-primary)'
                                                    : 'var(--border-hairline)',
                                                background: selected
                                                    ? 'var(--bg-surface-raised)'
                                                    : 'var(--bg-surface)',
                                            }}
                                            onMouseEnter={(event) => {
                                                if (!selected) {
                                                    event.currentTarget.style.background =
                                                        'var(--bg-surface-hover)'
                                                }
                                            }}
                                            onMouseLeave={(event) => {
                                                if (!selected) {
                                                    event.currentTarget.style.background =
                                                        'var(--bg-surface)'
                                                }
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p
                                                        className="truncate text-[13px] font-medium"
                                                        style={{
                                                            color:
                                                                'var(--text-primary)',
                                                        }}
                                                    >
                                                        {control.name}
                                                    </p>

                                                    <p
                                                        className="mt-1 text-[11px]"
                                                        style={{
                                                            color:
                                                                'var(--text-tertiary)',
                                                        }}
                                                    >
                                                        {control.category}
                                                    </p>
                                                </div>

                                                <span
                                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
                                                    style={{
                                                        borderColor: selected
                                                            ? 'var(--text-primary)'
                                                            : 'var(--border-hairline)',
                                                        background: selected
                                                            ? 'var(--text-primary)'
                                                            : 'transparent',
                                                        color:
                                                            'var(--text-inverse)',
                                                    }}
                                                >
                                                    {selected && (
                                                        <Check
                                                            size={12}
                                                            strokeWidth={2.5}
                                                        />
                                                    )}
                                                </span>
                                            </div>

                                            <div className="mt-5">
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="text-[11px]"
                                                        style={{
                                                            color:
                                                                'var(--text-tertiary)',
                                                        }}
                                                    >
                                                        Risk reduction
                                                    </span>

                                                    <span
                                                        className="font-data text-[11px] font-medium"
                                                        style={{
                                                            color:
                                                                reductionColor,
                                                        }}
                                                    >
                                                        {reduction.toFixed(1)}%
                                                    </span>
                                                </div>

                                                <div
                                                    className="mt-2 h-1.5 overflow-hidden rounded-full"
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
                                                                    reduction,
                                                                    0,
                                                                ),
                                                                100,
                                                            )}%`,
                                                            background:
                                                                reductionColor,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between border-t pt-3">
                                                <span
                                                    className="text-[11px]"
                                                    style={{
                                                        color:
                                                            'var(--text-tertiary)',
                                                    }}
                                                >
                                                    Cost
                                                </span>

                                                <span
                                                    className="font-data text-[11px] font-medium"
                                                    style={{
                                                        color:
                                                            'var(--text-primary)',
                                                    }}
                                                >
                                                    {formatINR(control.cost)}
                                                </span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Selection footer */}
                        {!loadingControls &&
                            controls.length > 0 && (
                                <div
                                    className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
                                    style={{
                                        borderColor:
                                            'var(--border-hairline-soft)',
                                    }}
                                >
                                    <div>
                                        <p
                                            className="text-[12px] font-medium"
                                            style={{
                                                color:
                                                    'var(--text-primary)',
                                            }}
                                        >
                                            {selectedIds.length} control
                                            {selectedIds.length === 1
                                                ? ''
                                                : 's'} selected
                                        </p>

                                        {selectedIds.length > 0 && (
                                            <p
                                                className="mt-0.5 text-[11px]"
                                                style={{
                                                    color:
                                                        'var(--text-tertiary)',
                                                }}
                                            >
                                                Selected investment:{' '}
                                                {formatINR(
                                                    selectedInvestment,
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSimulate}
                                        disabled={
                                            loadingSimulation ||
                                            selectedIds.length === 0
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{
                                            background:
                                                selectedIds.length === 0
                                                    ? 'var(--bg-surface-raised)'
                                                    : 'var(--accent-action)',
                                            color:
                                                selectedIds.length === 0
                                                    ? 'var(--text-tertiary)'
                                                    : 'var(--text-inverse)',
                                        }}
                                    >
                                        {loadingSimulation ? (
                                            <RefreshCw
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <SlidersHorizontal size={14} />
                                        )}

                                        {loadingSimulation
                                            ? 'Simulating...'
                                            : 'Run Simulation'}
                                    </button>
                                </div>
                            )}

                        {error && (
                            <div
                                className="mt-4 flex items-start justify-between gap-4 rounded-md border px-4 py-3"
                                style={{
                                    borderColor: '#FECACA',
                                    background:
                                        'var(--status-danger-bg)',
                                }}
                            >
                                <p
                                    className="text-[12px]"
                                    style={{
                                        color:
                                            'var(--status-danger-text)',
                                    }}
                                >
                                    {error}
                                </p>

                                {controls.length === 0 && (
                                    <button
                                        type="button"
                                        onClick={loadControls}
                                        className="shrink-0 text-[11px] font-medium underline"
                                        style={{
                                            color:
                                                'var(--status-danger-text)',
                                        }}
                                    >
                                        Retry
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Results */}
                {result && (
                    <>
                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            {/* Before */}
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
                                        EAL Before
                                    </span>

                                    <Wallet
                                        size={15}
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    />
                                </div>

                                <p
                                    className="font-data mt-4 text-2xl font-medium leading-none"
                                    style={{
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    {formatINR(result.beforeEal)}
                                </p>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Current estimated annual loss
                                </p>
                            </div>

                            {/* After */}
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
                                        EAL After
                                    </span>

                                    <TrendingDown
                                        size={15}
                                        style={{
                                            color:
                                                'var(--risk-safe)',
                                        }}
                                    />
                                </div>

                                <p
                                    className="font-data mt-4 text-2xl font-medium leading-none"
                                    style={{
                                        color:
                                            'var(--risk-safe)',
                                    }}
                                >
                                    {formatINR(result.afterEal)}
                                </p>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Projected annual loss
                                </p>
                            </div>

                            {/* Savings */}
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
                                        Annual Savings
                                    </span>

                                    <TrendingDown
                                        size={15}
                                        style={{
                                            color:
                                                'var(--risk-safe)',
                                        }}
                                    />
                                </div>

                                <p
                                    className="font-data mt-4 text-2xl font-medium leading-none"
                                    style={{
                                        color:
                                            'var(--risk-safe)',
                                    }}
                                >
                                    {formatINR(result.savings)}
                                </p>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Estimated loss avoided
                                </p>
                            </div>

                            {/* Investment */}
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
                                        Control Investment
                                    </span>

                                    <Wallet
                                        size={15}
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    />
                                </div>

                                <p
                                    className="font-data mt-4 text-2xl font-medium leading-none"
                                    style={{
                                        color:
                                            'var(--text-primary)',
                                    }}
                                >
                                    {formatINR(result.totalCost)}
                                </p>

                                <p
                                    className="mt-2 text-[11px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Total selected control cost
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
                                                'var(--risk-safe)',
                                        }}
                                    />
                                </div>

                                <p
                                    className="font-data mt-4 text-2xl font-medium leading-none"
                                    style={{
                                        color:
                                            'var(--risk-safe)',
                                    }}
                                >
                                    {riskReduction.toFixed(1)}%
                                </p>

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
                                                    riskReduction,
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
                                    Based on EAL improvement
                                </p>
                            </div>
                        </div>

                        {/* Simulation details */}
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
                                <div className="flex items-center gap-2">
                                    <ShieldCheck
                                        size={16}
                                        style={{
                                            color:
                                                'var(--text-primary)',
                                        }}
                                    />

                                    <h2
                                        className="text-sm font-semibold"
                                        style={{
                                            color:
                                                'var(--text-primary)',
                                        }}
                                    >
                                        Simulation Result
                                    </h2>
                                </div>

                                <p
                                    className="mt-0.5 text-[11px]"
                                    style={{
                                        color:
                                            'var(--text-tertiary)',
                                    }}
                                >
                                    Financial and risk impact of the selected
                                    security controls.
                                </p>
                            </div>

                            <div className="grid gap-5 p-5 md:grid-cols-3">
                                <div>
                                    <p
                                        className="text-[11px]"
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    >
                                        Selected Controls
                                    </p>

                                    <p
                                        className="font-data mt-1 text-sm font-medium"
                                        style={{
                                            color:
                                                'var(--text-primary)',
                                        }}
                                    >
                                        {result.selectedControls.length}
                                    </p>
                                </div>

                                <div>
                                    <p
                                        className="text-[11px]"
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    >
                                        ROSI
                                    </p>

                                    <div className="mt-1 flex items-center gap-2">
                                        <span
                                            className="font-data text-sm font-semibold"
                                            style={{
                                                color:
                                                    result.rosi >= 0
                                                        ? 'var(--risk-safe)'
                                                        : 'var(--risk-critical)',
                                            }}
                                        >
                                            {(result.rosi * 100).toFixed(
                                                1,
                                            )}
                                            %
                                        </span>

                                        <span
                                            className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                                            style={getRosiStyle(
                                                result.rosi,
                                            )}
                                        >
                                            {result.rosi >= 0
                                                ? 'Positive'
                                                : 'Negative'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p
                                        className="text-[11px]"
                                        style={{
                                            color:
                                                'var(--text-tertiary)',
                                        }}
                                    >
                                        Net Financial Benefit
                                    </p>

                                    <p
                                        className="font-data mt-1 text-sm font-semibold"
                                        style={{
                                            color:
                                                result.savings -
                                                    result.totalCost >=
                                                    0
                                                    ? 'var(--risk-safe)'
                                                    : 'var(--risk-critical)',
                                        }}
                                    >
                                        {formatINR(
                                            result.savings -
                                            result.totalCost,
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div
                                className="border-t px-5 py-4"
                                style={{
                                    borderColor:
                                        'var(--border-hairline-soft)',
                                }}
                            >
                                <p
                                    className="mb-3 text-[11px] font-medium"
                                    style={{
                                        color:
                                            'var(--text-secondary)',
                                    }}
                                >
                                    Selected Controls
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {result.selectedControls.map(
                                        (control) => (
                                            <span
                                                key={control.id}
                                                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px]"
                                                style={{
                                                    borderColor:
                                                        'var(--border-hairline)',
                                                    background:
                                                        'var(--bg-base)',
                                                    color:
                                                        'var(--text-secondary)',
                                                }}
                                            >
                                                <Check
                                                    size={11}
                                                    style={{
                                                        color:
                                                            'var(--risk-safe)',
                                                    }}
                                                />

                                                {control.name}
                                            </span>
                                        ),
                                    )}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    )
}