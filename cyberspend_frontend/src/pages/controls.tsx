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

export default function Controls() {
    const [controls, setControls] = useState<Control[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] =
        useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    async function loadControls() {
        try {
            setLoading(true)
            const data = await getControls()
            setControls(data)
        } catch {
            setError('Failed to load controls')
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
            riskReductionPct:
                String(control.riskReductionPct),
        })

        setError('')
        setShowForm(true)
    }

    async function handleSubmit(
        event: React.FormEvent,
    ) {
        event.preventDefault()
        setError('')

        const cost = Number(form.cost)
        const riskReductionPct =
            Number(form.riskReductionPct)

        if (!form.name.trim()) {
            setError('Control name is required')
            return
        }

        if (!form.category.trim()) {
            setError('Category is required')
            return
        }

        if (!cost || cost <= 0) {
            setError('Cost must be greater than 0')
            return
        }

        if (
            riskReductionPct < 0 ||
            riskReductionPct > 1
        ) {
            setError(
                'Risk reduction must be between 0 and 1',
            )
            return
        }

        try {
            if (editingId) {
                await updateControl(editingId, {
                    name: form.name.trim(),
                    category: form.category.trim(),
                    cost,
                    riskReductionPct,
                })
            } else {
                await createControl({
                    id: `C-${crypto.randomUUID().slice(0, 8)}`,
                    name: form.name.trim(),
                    category: form.category.trim(),
                    cost,
                    riskReductionPct,
                })
            }

            setShowForm(false)
            await loadControls()
        } catch {
            setError('Failed to save control')
        }
    }

    async function handleDelete(id: string) {
        if (
            !window.confirm(
                'Delete this security control?',
            )
        ) {
            return
        }

        try {
            await deleteControl(id)
            await loadControls()
        } catch {
            setError('Failed to delete control')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">
                        Controls
                    </h1>

                    <p className="mt-1 text-sm text-slate-400">
                        Define security controls and their expected risk reduction.
                    </p>
                </div>

                <button
                    onClick={openCreate}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                    + Add Control
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                    <h2 className="mb-5 text-base font-semibold text-white">
                        {editingId
                            ? 'Edit Control'
                            : 'Add Security Control'}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Control Name
                            </label>

                            <input
                                value={form.name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Multi Factor Authentication"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Category
                            </label>

                            <input
                                value={form.category}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        category: e.target.value,
                                    })
                                }
                                placeholder="Identity"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Implementation Cost (INR)
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={form.cost}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        cost: e.target.value,
                                    })
                                }
                                placeholder="200000"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Risk Reduction
                            </label>

                            <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.05"
                                value={form.riskReductionPct}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        riskReductionPct:
                                            e.target.value,
                                    })
                                }
                                placeholder="0.35"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />

                            <p className="mt-1 text-xs text-slate-500">
                                Enter 0 to 1. Example: 0.35 = 35%.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                        >
                            {editingId
                                ? 'Update Control'
                                : 'Create Control'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <div className="border-b border-slate-800 px-5 py-4">
                    <h2 className="text-sm font-medium text-white">
                        Security Controls
                    </h2>
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-slate-400">
                        Loading controls...
                    </div>
                ) : controls.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        No controls added yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-800 text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">
                                        Control
                                    </th>
                                    <th className="px-5 py-3">
                                        Category
                                    </th>
                                    <th className="px-5 py-3">
                                        Cost
                                    </th>
                                    <th className="px-5 py-3">
                                        Risk Reduction
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {controls.map((control) => (
                                    <tr
                                        key={control.id}
                                        className="border-b border-slate-800 last:border-0"
                                    >
                                        <td className="px-5 py-4 font-medium text-white">
                                            {control.name}
                                        </td>

                                        <td className="px-5 py-4 text-slate-400">
                                            {control.category}
                                        </td>

                                        <td className="px-5 py-4 text-slate-300">
                                            {formatINR(control.cost)}
                                        </td>

                                        <td className="px-5 py-4 text-slate-300">
                                            {Math.round(
                                                control.riskReductionPct *
                                                100,
                                            )}
                                            %
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() =>
                                                    openEdit(control)
                                                }
                                                className="mr-3 text-xs text-blue-400"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDelete(control.id)
                                                }
                                                className="text-xs text-red-400"
                                            >
                                                Delete
                                            </button>
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