import { useEffect, useState } from 'react'
import {
    createAsset,
    deleteAsset,
    getAssets,
    updateAsset,
    type Asset,
} from '../api/assets'
import { formatINR } from '../lib/format'

const emptyForm = {
    name: '',
    category: '',
    value: '',
    criticality: 'Medium' as Asset['criticality'],
    internetExposed: false,
}

export default function Assets() {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    async function loadAssets() {
        try {
            setLoading(true)
            const data = await getAssets()
            setAssets(data)
        } catch {
            setError('Failed to load assets')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAssets()
    }, [])

    function openCreate() {
        setEditingId(null)
        setForm(emptyForm)
        setError('')
        setShowForm(true)
    }

    function openEdit(asset: Asset) {
        setEditingId(asset.id)

        setForm({
            name: asset.name,
            category: asset.category,
            value: String(asset.value),
            criticality: asset.criticality,
            internetExposed: asset.internetExposed,
        })

        setError('')
        setShowForm(true)
    }

    async function handleSubmit(
        event: React.FormEvent,
    ) {
        event.preventDefault()
        setError('')

        const value = Number(form.value)

        if (!form.name.trim()) {
            setError('Asset name is required')
            return
        }

        if (!form.category.trim()) {
            setError('Category is required')
            return
        }

        if (!value || value <= 0) {
            setError('Business value must be greater than 0')
            return
        }

        try {
            if (editingId) {
                await updateAsset(editingId, {
                    name: form.name.trim(),
                    category: form.category.trim(),
                    value,
                    criticality: form.criticality,
                    internetExposed: form.internetExposed,
                })
            } else {
                await createAsset({
                    id: `A-${crypto.randomUUID().slice(0, 8)}`,
                    name: form.name.trim(),
                    category: form.category.trim(),
                    value,
                    criticality: form.criticality,
                    internetExposed: form.internetExposed,
                })
            }

            setShowForm(false)
            await loadAssets()
        } catch {
            setError('Failed to save asset')
        }
    }

    async function handleDelete(id: string) {
        const confirmed = window.confirm(
            'Delete this asset? Its vulnerabilities will also be deleted.',
        )

        if (!confirmed) return

        try {
            await deleteAsset(id)
            await loadAssets()
        } catch {
            setError('Failed to delete asset')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">
                        Assets
                    </h1>

                    <p className="mt-1 text-sm text-slate-400">
                        Manage the company's critical digital assets and business value.
                    </p>
                </div>

                <button
                    onClick={openCreate}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                    + Add Asset
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
                        {editingId ? 'Edit Asset' : 'Add Asset'}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Asset Name
                            </label>

                            <input
                                value={form.name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Customer Payments DB"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
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
                                placeholder="Database"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Business Value (INR)
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={form.value}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        value: e.target.value,
                                    })
                                }
                                placeholder="45000000"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Criticality
                            </label>

                            <select
                                value={form.criticality}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        criticality:
                                            e.target.value as Asset['criticality'],
                                    })
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Critical</option>
                            </select>
                        </div>
                    </div>

                    <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={form.internetExposed}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    internetExposed: e.target.checked,
                                })
                            }
                        />

                        Internet exposed
                    </label>

                    <div className="mt-5 flex gap-3">
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                        >
                            {editingId ? 'Update Asset' : 'Create Asset'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <div className="border-b border-slate-800 px-5 py-4">
                    <h2 className="text-sm font-medium text-white">
                        Company Assets
                    </h2>
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-slate-400">
                        Loading assets...
                    </div>
                ) : assets.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        No assets added yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-800 text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">Asset</th>
                                    <th className="px-5 py-3">Category</th>
                                    <th className="px-5 py-3">Value</th>
                                    <th className="px-5 py-3">Criticality</th>
                                    <th className="px-5 py-3">Exposure</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {assets.map((asset) => (
                                    <tr
                                        key={asset.id}
                                        className="border-b border-slate-800 last:border-0"
                                    >
                                        <td className="px-5 py-4 font-medium text-white">
                                            {asset.name}
                                        </td>

                                        <td className="px-5 py-4 text-slate-400">
                                            {asset.category}
                                        </td>

                                        <td className="px-5 py-4 text-slate-300">
                                            {formatINR(asset.value)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200">
                                                {asset.criticality}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-slate-400">
                                            {asset.internetExposed
                                                ? 'Internet'
                                                : 'Internal'}
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => openEdit(asset)}
                                                className="mr-3 text-xs text-blue-400 hover:text-blue-300"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                className="text-xs text-red-400 hover:text-red-300"
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