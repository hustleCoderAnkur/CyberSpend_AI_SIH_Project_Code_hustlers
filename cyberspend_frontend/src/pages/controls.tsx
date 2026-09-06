import { useEffect, useState } from 'react'
import {
    createControl,
    deleteControl,
    getControls,
    updateControl,
    type Control,
} from '../api/controls'
import { formatINR } from '../lib/format'

const emptyForm = {
    name: '',
    category: '',
    cost: '',
    riskReductionPct: '0',
}

function getReductionStyle(value: number) {
    if (value >= 0.4) {
        return {
            background: 'var(--status-success-bg)',
            color: 'var(--status-success-text)',
        }
    }

    if (value >= 0.25) {
        return {
            background: 'var(--status-info-bg)',
            color: 'var(--status-info-text)',
        }
    }

    return {
        background: 'var(--status-warning-bg)',
        color: 'var(--status-warning-text)',
    }
}

export default function Controls() {
    const [controls, setControls] = useState<Control[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function loadControls() {
        try {
            setLoading(true)
            setError('')

            const data = await getControls()
            setControls(data)
        } catch {
            setError('Failed to load controls. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadControls()
    }, [])

    function openCreate() {
        setEditingId(null)
        setForm(emptyForm)
        setError('')
        setShowForm(true)
    }

    function openEdit(control: Control) {
        setEditingId(control.id)

        setForm({
            name: control.name,
            category: control.category,
            cost: String(control.cost),
            riskReductionPct: String(control.riskReductionPct),
        })

        setError('')
        setShowForm(true)
    }

    function closeForm() {
        if (saving) return

        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm)
        setError('')
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setError('')

        const name = form.name.trim()
        const category = form.category.trim()
        const cost = Number(form.cost)
        const riskReductionPct = Number(form.riskReductionPct)

        if (!name) {
            setError('Control name is required.')
            return
        }

        if (!category) {
            setError('Category is required.')
            return
        }

        if (!Number.isFinite(cost) || cost <= 0) {
            setError('Cost must be greater than 0.')
            return
        }

        if (
            !Number.isFinite(riskReductionPct) ||
            riskReductionPct < 0 ||
            riskReductionPct > 1
        ) {
            setError('Risk reduction must be between 0 and 1.')
            return
        }

        try {
            setSaving(true)

            if (editingId) {
                await updateControl(editingId, {
                    name,
                    category,
                    cost,
                    riskReductionPct,
                })
            } else {
                await createControl({
                    id: `C-${crypto.randomUUID().slice(0, 8)}`,
                    name,
                    category,
                    cost,
                    riskReductionPct,
                })
            }

            closeForm()
            await loadControls()
        } catch {
            setError(
                editingId
                    ? 'Failed to update control. Please try again.'
                    : 'Failed to create control. Please try again.',
            )
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        const confirmed = window.confirm(
            'Delete this security control?',
        )

        if (!confirmed) return

        try {
            setDeletingId(id)
            setError('')

            await deleteControl(id)
            await loadControls()
        } catch {
            setError(
                'Failed to delete control. Please try again.',
            )
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div
            className="min-h-screen"
            style={{ background: 'var(--bg-base)' }}
        >
            <div className="mx-auto w-full max-w-7xl px-6 py-7 lg:px-8">
                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1
                                className="text-2xl font-extrabold tracking-tight"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Security Controls
                            </h1>

                            {!loading && (
                                <span
                                    className="rounded-full border-2 px-2.5 py-0.5 text-[11px] font-bold"
                                    style={{
                                        borderColor: 'var(--border-strong)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {controls.length}
                                </span>
                            )}
                        </div>

                        <p
                            className="mt-1 text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Define security controls and their expected risk
                            reduction.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors duration-150"
                        style={{
                            background: 'var(--accent-action)',
                            color: 'var(--text-inverse)',
                            borderRadius: 'var(--radius-sm)',
                        }}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.background =
                                'var(--accent-action-hover)'
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.background =
                                'var(--accent-action)'
                        }}
                    >
                        + Add Control
                    </button>
                </header>

                {/* Error */}
                {error && (
                    <div
                        className="mt-5 flex items-start justify-between gap-4 border-2 px-4 py-3"
                        style={{
                            borderColor: '#FECACA',
                            background: 'var(--status-danger-bg)',
                            borderRadius: 'var(--radius-md)',
                        }}
                    >
                        <span
                            className="text-[13px] font-medium"
                            style={{ color: 'var(--status-danger-text)' }}
                        >
                            {error}
                        </span>

                        {!showForm && (
                            <button
                                type="button"
                                onClick={loadControls}
                                className="shrink-0 text-[12px] font-bold underline underline-offset-2"
                                style={{
                                    color: 'var(--status-danger-text)',
                                }}
                            >
                                Retry
                            </button>
                        )}
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 border-2"
                        style={{
                            borderColor: 'var(--border-strong)',
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-md)',
                        }}
                    >
                        <div
                            className="border-b-2 px-5 py-4"
                            style={{
                                borderColor: 'var(--border-strong)',
                            }}
                        >
                            <h2
                                className="text-base font-bold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {editingId
                                    ? 'Edit Control'
                                    : 'Add Security Control'}
                            </h2>

                            <p
                                className="mt-0.5 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Define the implementation cost and expected
                                risk reduction.
                            </p>
                        </div>

                        <div className="grid gap-5 p-5 md:grid-cols-2">
                            {/* Control name */}
                            <div>
                                <label
                                    htmlFor="control-name"
                                    className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Control Name
                                </label>

                                <input
                                    id="control-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            name: event.target.value,
                                        })
                                    }
                                    placeholder="Multi Factor Authentication"
                                    className="w-full border-2 px-3 py-2.5 text-[13px] outline-none transition-colors"
                                    style={{
                                        borderColor: 'var(--border-hairline)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}
                                    onFocus={(event) => {
                                        event.currentTarget.style.borderColor =
                                            'var(--border-strong)'
                                    }}
                                    onBlur={(event) => {
                                        event.currentTarget.style.borderColor =
                                            'var(--border-hairline)'
                                    }}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label
                                    htmlFor="control-category"
                                    className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Category
                                </label>

                                <input
                                    id="control-category"
                                    value={form.category}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            category: event.target.value,
                                        })
                                    }
                                    placeholder="Identity"
                                    className="w-full border-2 px-3 py-2.5 text-[13px] outline-none transition-colors"
                                    style={{
                                        borderColor: 'var(--border-hairline)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}
                                    onFocus={(event) => {
                                        event.currentTarget.style.borderColor =
                                            'var(--border-strong)'
                                    }}
                                    onBlur={(event) => {
                                        event.currentTarget.style.borderColor =
                                            'var(--border-hairline)'
                                    }}
                                />
                            </div>

                            {/* Cost */}
                            <div>
                                <label
                                    htmlFor="control-cost"
                                    className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Implementation Cost
                                </label>

                                <div className="relative">
                                    <span
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px]"
                                        style={{ color: 'var(--text-tertiary)' }}
                                    >
                                        ₹
                                    </span>

                                    <input
                                        id="control-cost"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={form.cost}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                cost: event.target.value,
                                            })
                                        }
                                        placeholder="200000"
                                        className="font-data w-full border-2 py-2.5 pl-7 pr-3 text-[13px] outline-none transition-colors"
                                        style={{
                                            borderColor:
                                                'var(--border-hairline)',
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                            borderRadius: 'var(--radius-sm)',
                                        }}
                                        onFocus={(event) => {
                                            event.currentTarget.style.borderColor =
                                                'var(--border-strong)'
                                        }}
                                        onBlur={(event) => {
                                            event.currentTarget.style.borderColor =
                                                'var(--border-hairline)'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Risk reduction */}
                            <div>
                                <label
                                    htmlFor="risk-reduction"
                                    className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Risk Reduction
                                </label>

                                <input
                                    id="risk-reduction"
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={form.riskReductionPct}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            riskReductionPct:
                                                event.target.value,
                                        })
                                    }
                                    placeholder="0.35"
                                    className="font-data w-full border-2 px-3 py-2.5 text-[13px] outline-none transition-colors"
                                    style={{
                                        borderColor:
                                            'var(--border-hairline)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}
                                    onFocus={(event) => {
                                        event.currentTarget.style.borderColor =
                                            'var(--border-strong)'
                                    }}
                                    onBlur={(event) => {
                                        event.currentTarget.style.borderColor =
                                            'var(--border-hairline)'
                                    }}
                                />

                                <p
                                    className="mt-1 text-[11px]"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Enter 0 to 1. Example: 0.35 = 35%.
                                </p>
                            </div>
                        </div>

                        {/* Form actions */}
                        <div
                            className="flex flex-col-reverse gap-2 border-t-2 px-5 py-4 sm:flex-row sm:justify-end"
                            style={{
                                borderColor: 'var(--border-strong)',
                            }}
                        >
                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="border-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-secondary)',
                                    borderRadius: 'var(--radius-sm)',
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide"
                                style={{
                                    background: saving
                                        ? 'var(--bg-surface-raised)'
                                        : 'var(--accent-action)',
                                    color: saving
                                        ? 'var(--text-tertiary)'
                                        : 'var(--text-inverse)',
                                    borderRadius: 'var(--radius-sm)',
                                }}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingId
                                        ? 'Update Control'
                                        : 'Create Control'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Controls table */}
                <section
                    className="mt-6 overflow-hidden border-2"
                    style={{
                        borderColor: 'var(--border-strong)',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                    }}
                >
                    <div
                        className="flex items-center justify-between border-b-2 px-5 py-4"
                        style={{
                            borderColor: 'var(--border-strong)',
                        }}
                    >
                        <div>
                            <h2
                                className="text-base font-bold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Security Controls
                            </h2>

                            <p
                                className="mt-0.5 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Controls available for risk mitigation and
                                investment optimization.
                            </p>
                        </div>

                        {!loading && controls.length > 0 && (
                            <span
                                className="font-data text-[11px] font-semibold"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                {controls.length} total
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-3 p-5">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="h-12 animate-pulse rounded-md"
                                    style={{
                                        background:
                                            'var(--bg-surface-raised)',
                                    }}
                                />
                            ))}
                        </div>
                    ) : controls.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div
                                className="mx-auto flex h-10 w-10 items-center justify-center border-2"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-base)',
                                    color: 'var(--text-tertiary)',
                                    borderRadius: 'var(--radius-sm)',
                                }}
                            >
                                <span className="text-sm">—</span>
                            </div>

                            <h3
                                className="mt-3 text-sm font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                No controls yet
                            </h3>

                            <p
                                className="mx-auto mt-1 max-w-sm text-[12px]"
                                style={{
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                Add security controls to make them
                                available for risk reduction and investment
                                planning.
                            </p>

                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-4 border-2 px-3 py-2 text-[12px] font-bold uppercase tracking-wide"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                }}
                            >
                                Add first control
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-190 text-left">
                                <thead
                                    className="border-b-2"
                                    style={{
                                        borderColor: 'var(--border-strong)',
                                        background: 'var(--bg-base)',
                                    }}
                                >
                                    <tr>
                                        <th
                                            className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                            style={{
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            Control
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                            style={{
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            Category
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                            style={{
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            Cost
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                            style={{
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            Risk Reduction
                                        </th>

                                        <th
                                            className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide"
                                            style={{
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {controls.map((control) => {
                                        const reduction =
                                            Math.min(
                                                Math.max(
                                                    control.riskReductionPct,
                                                    0,
                                                ),
                                                1,
                                            ) * 100

                                        const reductionStyle =
                                            getReductionStyle(
                                                control.riskReductionPct,
                                            )

                                        return (
                                            <tr
                                                key={control.id}
                                                className="border-b last:border-0 transition-colors duration-100"
                                                style={{
                                                    borderColor:
                                                        'var(--border-hairline)',
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
                                                {/* Control */}
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <div
                                                            className="text-[13px] font-semibold"
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

                                                {/* Category */}
                                                <td
                                                    className="px-5 py-4 text-[12px]"
                                                    style={{
                                                        color:
                                                            'var(--text-secondary)',
                                                    }}
                                                >
                                                    {control.category}
                                                </td>

                                                {/* Cost */}
                                                <td
                                                    className="font-data px-5 py-4 text-[12px] font-semibold"
                                                    style={{
                                                        color: 'var(--text-primary)',
                                                    }}
                                                >
                                                    {formatINR(control.cost)}
                                                </td>

                                                {/* Risk reduction */}
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
                                                                    width: `${reduction}%`,
                                                                    background:
                                                                        'var(--risk-safe)',
                                                                }}
                                                            />
                                                        </div>

                                                        <span
                                                            className="font-data inline-flex rounded-full px-2 py-1 text-[10px] font-bold"
                                                            style={{
                                                                background:
                                                                    reductionStyle.background,
                                                                color:
                                                                    reductionStyle.color,
                                                            }}
                                                        >
                                                            {Math.round(reduction)}%
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(control)
                                                        }
                                                        className="mr-4 text-[12px] font-bold"
                                                        style={{
                                                            color:
                                                                'var(--text-secondary)',
                                                        }}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(control.id)
                                                        }
                                                        disabled={
                                                            deletingId === control.id
                                                        }
                                                        className="text-[12px] font-bold"
                                                        style={{
                                                            color:
                                                                deletingId ===
                                                                    control.id
                                                                    ? 'var(--text-tertiary)'
                                                                    : 'var(--status-danger-text)',
                                                        }}
                                                    >
                                                        {deletingId === control.id
                                                            ? 'Deleting...'
                                                            : 'Delete'}
                                                    </button>
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