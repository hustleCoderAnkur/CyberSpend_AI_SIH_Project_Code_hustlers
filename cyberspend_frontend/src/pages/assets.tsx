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

const criticalityStyles: Record<
    Asset['criticality'],
    { background: string; color: string }
> = {
    Low: {
        background: 'var(--status-success-bg)',
        color: 'var(--status-success-text)',
    },
    Medium: {
        background: 'var(--status-warning-bg)',
        color: 'var(--status-warning-text)',
    },
    High: {
        background: '#FFF7ED',
        color: '#C2410C',
    },
    Critical: {
        background: 'var(--status-danger-bg)',
        color: 'var(--status-danger-text)',
    },
}

export default function Assets() {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function loadAssets() {
        try {
            setLoading(true)
            setError('')

            const data = await getAssets()
            setAssets(data)
        } catch {
            setError('Failed to load assets. Please try again.')
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
        const value = Number(form.value)

        if (!name) {
            setError('Asset name is required.')
            return
        }

        if (!category) {
            setError('Category is required.')
            return
        }

        if (!Number.isFinite(value) || value <= 0) {
            setError('Business value must be greater than 0.')
            return
        }

        try {
            setSaving(true)

            if (editingId) {
                await updateAsset(editingId, {
                    name,
                    category,
                    value,
                    criticality: form.criticality,
                    internetExposed: form.internetExposed,
                })
            } else {
                await createAsset({
                    id: `A-${crypto.randomUUID().slice(0, 8)}`,
                    name,
                    category,
                    value,
                    criticality: form.criticality,
                    internetExposed: form.internetExposed,
                })
            }

            closeForm()
            await loadAssets()
        } catch {
            setError(
                editingId
                    ? 'Failed to update asset. Please try again.'
                    : 'Failed to create asset. Please try again.',
            )
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        const confirmed = window.confirm(
            'Delete this asset? Its vulnerabilities will also be deleted.',
        )

        if (!confirmed) return

        try {
            setDeletingId(id)
            setError('')

            await deleteAsset(id)
            await loadAssets()
        } catch {
            setError('Failed to delete asset. Please try again.')
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
                        <div className="flex items-center gap-2">
                            <h1
                                className="text-xl font-semibold tracking-tight"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Assets
                            </h1>

                            {!loading && (
                                <span
                                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                    style={{
                                        background: 'var(--bg-surface-raised)',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {assets.length}
                                </span>
                            )}
                        </div>

                        <p
                            className="mt-1 text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Manage the company's critical digital assets and business value.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center justify-center rounded-md px-4 py-2 text-[13px] font-medium transition-colors duration-150"
                        style={{
                            background: 'var(--accent-action)',
                            color: 'var(--text-inverse)',
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
                        + Add Asset
                    </button>
                </header>

                {/* Error */}
                {error && (
                    <div
                        className="mt-5 flex items-start justify-between gap-4 rounded-md border px-4 py-3"
                        style={{
                            borderColor: '#FECACA',
                            background: 'var(--status-danger-bg)',
                            color: 'var(--status-danger-text)',
                        }}
                    >
                        <span className="text-[13px]">{error}</span>

                        {!showForm && (
                            <button
                                type="button"
                                onClick={loadAssets}
                                className="shrink-0 text-[12px] font-medium underline underline-offset-2"
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
                        className="mt-6 rounded-lg border"
                        style={{
                            borderColor: 'var(--border-hairline)',
                            background: 'var(--bg-surface)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div
                            className="border-b px-5 py-4"
                            style={{ borderColor: 'var(--border-hairline-soft)' }}
                        >
                            <h2
                                className="text-sm font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {editingId ? 'Edit Asset' : 'Add Asset'}
                            </h2>

                            <p
                                className="mt-0.5 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Enter the asset details used by the risk engine.
                            </p>
                        </div>

                        <div className="grid gap-5 p-5 md:grid-cols-2">
                            {/* Asset name */}
                            <div>
                                <label
                                    htmlFor="asset-name"
                                    className="mb-1.5 block text-[12px] font-medium"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Asset Name
                                </label>

                                <input
                                    id="asset-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            name: event.target.value,
                                        })
                                    }
                                    placeholder="Customer Payments DB"
                                    className="w-full rounded-md border px-3 py-2 text-[13px] outline-none transition-colors"
                                    style={{
                                        borderColor: 'var(--border-hairline)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                    }}
                                    onFocus={(event) => {
                                        event.currentTarget.style.borderColor = '#A1A1AA'
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
                                    htmlFor="asset-category"
                                    className="mb-1.5 block text-[12px] font-medium"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Category
                                </label>

                                <input
                                    id="asset-category"
                                    value={form.category}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            category: event.target.value,
                                        })
                                    }
                                    placeholder="Database"
                                    className="w-full rounded-md border px-3 py-2 text-[13px] outline-none transition-colors"
                                    style={{
                                        borderColor: 'var(--border-hairline)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                    }}
                                    onFocus={(event) => {
                                        event.currentTarget.style.borderColor = '#A1A1AA'
                                    }}
                                    onBlur={(event) => {
                                        event.currentTarget.style.borderColor =
                                            'var(--border-hairline)'
                                    }}
                                />
                            </div>

                            {/* Business value */}
                            <div>
                                <label
                                    htmlFor="asset-value"
                                    className="mb-1.5 block text-[12px] font-medium"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Business Value
                                </label>

                                <div className="relative">
                                    <span
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px]"
                                        style={{ color: 'var(--text-tertiary)' }}
                                    >
                                        ₹
                                    </span>

                                    <input
                                        id="asset-value"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={form.value}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                value: event.target.value,
                                            })
                                        }
                                        placeholder="45000000"
                                        className="font-data w-full rounded-md border py-2 pl-7 pr-3 text-[13px] outline-none transition-colors"
                                        style={{
                                            borderColor: 'var(--border-hairline)',
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                        }}
                                        onFocus={(event) => {
                                            event.currentTarget.style.borderColor = '#A1A1AA'
                                        }}
                                        onBlur={(event) => {
                                            event.currentTarget.style.borderColor =
                                                'var(--border-hairline)'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Criticality */}
                            <div>
                                <label
                                    htmlFor="asset-criticality"
                                    className="mb-1.5 block text-[12px] font-medium"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Criticality
                                </label>

                                <select
                                    id="asset-criticality"
                                    value={form.criticality}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            criticality:
                                                event.target.value as Asset['criticality'],
                                        })
                                    }
                                    className="w-full rounded-md border px-3 py-2 text-[13px] outline-none"
                                    style={{
                                        borderColor: 'var(--border-hairline)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        {/* Exposure */}
                        <div className="px-5 pb-5">
                            <label
                                className="inline-flex cursor-pointer items-center gap-2.5"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <input
                                    type="checkbox"
                                    checked={form.internetExposed}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            internetExposed: event.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 accent-black"
                                />

                                <span className="text-[13px]">Internet exposed</span>
                            </label>

                            <p
                                className="ml-6 mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Mark this if the asset is directly reachable from the public
                                internet.
                            </p>
                        </div>

                        {/* Form actions */}
                        <div
                            className="flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end"
                            style={{ borderColor: 'var(--border-hairline-soft)' }}
                        >
                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="rounded-md border px-4 py-2 text-[13px] font-medium transition-colors"
                                style={{
                                    borderColor: 'var(--border-hairline)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-md px-4 py-2 text-[13px] font-medium"
                                style={{
                                    background: saving
                                        ? 'var(--bg-surface-raised)'
                                        : 'var(--accent-action)',
                                    color: saving
                                        ? 'var(--text-tertiary)'
                                        : 'var(--text-inverse)',
                                }}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingId
                                        ? 'Update Asset'
                                        : 'Create Asset'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Asset table */}
                <section
                    className="mt-6 overflow-hidden rounded-lg border"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        background: 'var(--bg-surface)',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    <div
                        className="flex items-center justify-between border-b px-5 py-4"
                        style={{ borderColor: 'var(--border-hairline-soft)' }}
                    >
                        <div>
                            <h2
                                className="text-sm font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Company Assets
                            </h2>

                            <p
                                className="mt-0.5 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Assets currently available to the platform.
                            </p>
                        </div>

                        {!loading && assets.length > 0 && (
                            <span
                                className="font-data text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                {assets.length} total
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-3 p-5">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="h-12 animate-pulse rounded-md"
                                    style={{ background: 'var(--bg-surface-raised)' }}
                                />
                            ))}
                        </div>
                    ) : assets.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div
                                className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border"
                                style={{
                                    borderColor: 'var(--border-hairline)',
                                    background: 'var(--bg-base)',
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                <span className="text-sm">—</span>
                            </div>

                            <h3
                                className="mt-3 text-sm font-medium"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                No assets yet
                            </h3>

                            <p
                                className="mx-auto mt-1 max-w-sm text-[12px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Add an asset manually or import company data to populate the
                                inventory.
                            </p>

                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-4 rounded-md border px-3 py-2 text-[12px] font-medium"
                                style={{
                                    borderColor: 'var(--border-hairline)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Add first asset
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-190 text-left">
                                <thead
                                    className="border-b"
                                    style={{
                                        borderColor: 'var(--border-hairline-soft)',
                                        background: 'var(--bg-base)',
                                    }}
                                >
                                    <tr>
                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            Asset
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            Category
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            Business Value
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            Criticality
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            Exposure
                                        </th>

                                        <th
                                            className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {assets.map((asset) => {
                                        const criticality = criticalityStyles[asset.criticality]

                                        return (
                                            <tr
                                                key={asset.id}
                                                className="border-b last:border-0 transition-colors duration-100"
                                                style={{
                                                    borderColor: 'var(--border-hairline-soft)',
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
                                                            style={{ color: 'var(--text-primary)' }}
                                                        >
                                                            {asset.name}
                                                        </div>

                                                        <div
                                                            className="font-data mt-0.5 text-[10px]"
                                                            style={{ color: 'var(--text-tertiary)' }}
                                                        >
                                                            {asset.id}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td
                                                    className="px-5 py-4 text-[13px]"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    {asset.category}
                                                </td>

                                                <td
                                                    className="font-data px-5 py-4 text-[12px]"
                                                    style={{ color: 'var(--text-primary)' }}
                                                >
                                                    {formatINR(asset.value)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className="inline-flex rounded-full px-2 py-1 text-[10px] font-medium"
                                                        style={{
                                                            background: criticality.background,
                                                            color: criticality.color,
                                                        }}
                                                    >
                                                        {asset.criticality}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 text-[12px]"
                                                        style={{
                                                            color: asset.internetExposed
                                                                ? 'var(--status-danger-text)'
                                                                : 'var(--text-secondary)',
                                                        }}
                                                    >
                                                        <span
                                                            className="h-1.5 w-1.5 rounded-full"
                                                            style={{
                                                                background: asset.internetExposed
                                                                    ? 'var(--risk-critical)'
                                                                    : 'var(--risk-safe)',
                                                            }}
                                                        />

                                                        {asset.internetExposed ? 'Internet' : 'Internal'}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(asset)}
                                                        className="mr-4 text-[12px] font-medium"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(asset.id)}
                                                        disabled={deletingId === asset.id}
                                                        className="text-[12px] font-medium"
                                                        style={{
                                                            color:
                                                                deletingId === asset.id
                                                                    ? 'var(--text-tertiary)'
                                                                    : 'var(--status-danger-text)',
                                                        }}
                                                    >
                                                        {deletingId === asset.id
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