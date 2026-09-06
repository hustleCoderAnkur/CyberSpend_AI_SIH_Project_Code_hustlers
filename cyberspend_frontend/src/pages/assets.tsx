import { useEffect, useState, type FormEvent } from 'react'
import {
    createAsset,
    deleteAsset,
    getAssets,
    updateAsset,
    type Asset,
} from '../api/assets'
import { formatINR } from '../lib/format'
import {
    Globe2,
    Pencil,
    Plus,
    RefreshCw,
    Server,
    ShieldAlert,
    Trash2,
    X,
} from 'lucide-react'

const emptyForm = {
    name: '',
    category: '',
    value: '',
    criticality: 'Medium' as Asset['criticality'],
    internetExposed: false,
}

const criticalityStyles: Record<
    Asset['criticality'],
    { background: string; color: string; border: string }
> = {
    Low: {
        background: 'var(--status-success-bg)',
        color: 'var(--status-success-text)',
        border: '#BBF7D0',
    },
    Medium: {
        background: 'var(--status-warning-bg)',
        color: 'var(--status-warning-text)',
        border: '#FDE68A',
    },
    High: {
        background: '#FFF7ED',
        color: '#C2410C',
        border: '#FED7AA',
    },
    Critical: {
        background: 'var(--status-danger-bg)',
        color: 'var(--status-danger-text)',
        border: '#FECACA',
    },
}

function Field({
    label,
    hint,
    children,
}: {
    label: string
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
                <label className="text-[12px] font-semibold uppercase tracking-[0.08em]">
                    {label}
                </label>
                {hint && (
                    <span
                        className="text-[11px]"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        {hint}
                    </span>
                )}
            </div>
            {children}
        </div>
    )
}

const inputClass =
    'w-full border-2 px-3.5 py-3 text-[14px] outline-none transition-colors placeholder:text-[#A1A1AA]'

const inputStyle = {
    borderColor: 'var(--border-hairline)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
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

    async function handleSubmit(event: FormEvent) {
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

    const criticalCount = assets.filter(
        (asset) => asset.criticality === 'Critical',
    ).length

    const exposedCount = assets.filter(
        (asset) => asset.internetExposed,
    ).length

    const totalValue = assets.reduce(
        (sum, asset) => sum + Number(asset.value || 0),
        0,
    )

    return (
        <div
            className="min-h-screen"
            style={{ background: 'var(--bg-base)' }}
        >
            <div className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-7 lg:px-10 lg:py-8">
                {/* Page header */}
                <header className="mb-7 border-b-2 pb-6" style={{ borderColor: 'var(--border-strong)' }}>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div
                                className="mb-2 font-data text-[11px] font-semibold uppercase tracking-[0.14em]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Asset Inventory / 01
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
                                    Assets
                                </h1>
                                {!loading && (
                                    <span
                                        className="font-data border-2 px-2.5 py-1 text-xs font-bold"
                                        style={{
                                            borderColor: 'var(--border-strong)',
                                            background: 'var(--bg-surface)',
                                        }}
                                    >
                                        {assets.length.toString().padStart(2, '0')}
                                    </span>
                                )}
                            </div>
                            <p
                                className="mt-2 max-w-2xl text-[14px] sm:text-[15px]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Manage critical digital assets, business value,
                                exposure, and criticality used by the risk engine.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex h-11 items-center justify-center gap-2 border-2 px-5 text-[13px] font-bold uppercase tracking-[0.04em] transition-colors"
                            style={{
                                borderColor: 'var(--border-strong)',
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
                            <Plus size={16} strokeWidth={2.5} />
                            Add Asset
                        </button>
                    </div>
                </header>

                {/* Overview strip */}
                <section className="mb-7 grid grid-cols-2 border-2 sm:grid-cols-4" style={{ borderColor: 'var(--border-strong)' }}>
                    <div className="border-b-2 p-4 sm:border-b-0 sm:border-r-2" style={{ borderColor: 'var(--border-strong)' }}>
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-tertiary)' }}>
                            Total Assets
                        </div>
                        <div className="stat-value text-2xl sm:text-3xl">
                            {loading ? '—' : assets.length}
                        </div>
                    </div>

                    <div className="border-b-2 p-4 sm:border-b-0 sm:border-r-2" style={{ borderColor: 'var(--border-strong)' }}>
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-tertiary)' }}>
                            Portfolio Value
                        </div>
                        <div className="stat-value text-xl sm:text-2xl">
                            {loading ? '—' : formatINR(totalValue)}
                        </div>
                    </div>

                    <div className="border-r-2 p-4" style={{ borderColor: 'var(--border-strong)' }}>
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-tertiary)' }}>
                            Internet Exposed
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="stat-value text-2xl sm:text-3xl">
                                {loading ? '—' : exposedCount}
                            </div>
                            {!loading && exposedCount > 0 && (
                                <Globe2 size={17} style={{ color: 'var(--risk-critical)' }} />
                            )}
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-tertiary)' }}>
                            Critical
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="stat-value text-2xl sm:text-3xl">
                                {loading ? '—' : criticalCount}
                            </div>
                            {!loading && criticalCount > 0 && (
                                <ShieldAlert size={17} style={{ color: 'var(--risk-critical)' }} />
                            )}
                        </div>
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <div
                        className="mb-7 flex items-start justify-between gap-4 border-2 px-4 py-3"
                        style={{
                            borderColor: 'var(--risk-critical)',
                            background: 'var(--status-danger-bg)',
                            color: 'var(--status-danger-text)',
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="mt-0.5 shrink-0" size={17} />
                            <span className="text-[13px] font-medium">{error}</span>
                        </div>

                        {!showForm && (
                            <button
                                type="button"
                                onClick={loadAssets}
                                className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide underline underline-offset-2"
                            >
                                <RefreshCw size={13} />
                                Retry
                            </button>
                        )}
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <form
                        onSubmit={handleSubmit}
                        className="mb-7 border-2"
                        style={{
                            borderColor: 'var(--border-strong)',
                            background: 'var(--bg-surface)',
                        }}
                    >
                        <div
                            className="flex items-start justify-between gap-4 border-b-2 px-5 py-4 sm:px-6"
                            style={{ borderColor: 'var(--border-strong)' }}
                        >
                            <div>
                                <div
                                    className="font-data mb-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Asset configuration
                                </div>
                                <h2 className="text-xl font-extrabold">
                                    {editingId ? 'Edit Asset' : 'Add Asset'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                aria-label="Close form"
                                className="flex h-9 w-9 items-center justify-center border-2 transition-colors"
                                style={{
                                    borderColor: 'var(--border-hairline)',
                                    background: 'var(--bg-base)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
                            <Field label="Asset name">
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
                                    className={inputClass}
                                    style={inputStyle}
                                />
                            </Field>

                            <Field label="Category">
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
                                    className={inputClass}
                                    style={inputStyle}
                                />
                            </Field>

                            <Field label="Business value" hint="INR">
                                <div className="relative">
                                    <span
                                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-data text-[14px] font-bold"
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
                                        className={`${inputClass} font-data pl-8`}
                                        style={inputStyle}
                                    />
                                </div>
                            </Field>

                            <Field label="Criticality">
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
                                    className={inputClass}
                                    style={inputStyle}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </Field>

                            <div
                                className="flex items-center justify-between gap-4 border-2 p-4 md:col-span-2"
                                style={{
                                    borderColor: 'var(--border-hairline)',
                                    background: 'var(--bg-base)',
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <Globe2 size={19} className="mt-0.5" />
                                    <div>
                                        <div className="text-[13px] font-bold">
                                            Internet exposed
                                        </div>
                                        <div
                                            className="mt-0.5 text-[12px]"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            Mark if this asset is directly reachable from
                                            the public internet.
                                        </div>
                                    </div>
                                </div>

                                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={form.internetExposed}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                internetExposed: event.target.checked,
                                            })
                                        }
                                        className="peer sr-only"
                                    />
                                    <span
                                        className="h-6 w-11 border-2 border-black bg-white transition-colors peer-checked:bg-black peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
                                    >
                                        <span className="block h-5 w-5 border-r-2 border-black bg-white transition-transform peer-checked:translate-x-5 peer-checked:border-l-2 peer-checked:border-r-0" />
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div
                            className="flex flex-col-reverse gap-2 border-t-2 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"
                            style={{ borderColor: 'var(--border-strong)' }}
                        >
                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="border-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide"
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
                                className="border-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide"
                                style={{
                                    borderColor: 'var(--border-strong)',
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

                {/* Inventory */}
                <section
                    className="border-2"
                    style={{
                        borderColor: 'var(--border-strong)',
                        background: 'var(--bg-surface)',
                    }}
                >
                    <div
                        className="flex flex-col gap-3 border-b-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                        style={{ borderColor: 'var(--border-strong)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-9 w-9 items-center justify-center border-2"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-base)',
                                }}
                            >
                                <Server size={17} />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold">
                                    Company Assets
                                </h2>
                                <p
                                    className="text-[12px]"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Current digital asset inventory.
                                </p>
                            </div>
                        </div>

                        {!loading && (
                            <div
                                className="font-data text-[11px] font-semibold uppercase tracking-wide"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                {assets.length} records
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="divide-y-2" style={{ borderColor: 'var(--border-hairline)' }}>
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="grid animate-pulse gap-3 p-5 md:grid-cols-6"
                                >
                                    <div className="h-4 rounded-sm bg-[#E4E5E7] md:col-span-2" />
                                    <div className="h-4 rounded-sm bg-[#E4E5E7]" />
                                    <div className="h-4 rounded-sm bg-[#E4E5E7]" />
                                    <div className="h-4 rounded-sm bg-[#E4E5E7]" />
                                    <div className="h-4 rounded-sm bg-[#E4E5E7]" />
                                </div>
                            ))}
                        </div>
                    ) : assets.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div
                                className="mx-auto flex h-12 w-12 items-center justify-center border-2"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--bg-base)',
                                }}
                            >
                                <Server size={20} />
                            </div>
                            <h3 className="mt-4 text-lg font-extrabold">
                                No assets yet
                            </h3>
                            <p
                                className="mx-auto mt-1 max-w-md text-[13px]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Add an asset manually or import company data to
                                populate the inventory.
                            </p>
                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-5 inline-flex items-center gap-2 border-2 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide"
                                style={{
                                    borderColor: 'var(--border-strong)',
                                    background: 'var(--accent-action)',
                                    color: 'var(--text-inverse)',
                                }}
                            >
                                <Plus size={15} />
                                Add first asset
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead
                                    style={{
                                        background: 'var(--bg-base)',
                                        borderBottom:
                                            '2px solid var(--border-strong)',
                                    }}
                                >
                                    <tr>
                                        {[
                                            'Asset',
                                            'Category',
                                            'Business Value',
                                            'Criticality',
                                            'Exposure',
                                            'Actions',
                                        ].map((heading, index) => (
                                            <th
                                                key={heading}
                                                className={`px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] ${index === 5
                                                        ? 'text-right'
                                                        : ''
                                                    }`}
                                                style={{
                                                    color: 'var(--text-tertiary)',
                                                }}
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {assets.map((asset) => {
                                        const criticality =
                                            criticalityStyles[asset.criticality]

                                        return (
                                            <tr
                                                key={asset.id}
                                                className="border-b-2 transition-colors last:border-b-0"
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
                                                <td className="px-5 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="flex h-9 w-9 shrink-0 items-center justify-center border-2"
                                                            style={{
                                                                borderColor:
                                                                    'var(--border-hairline)',
                                                                background:
                                                                    'var(--bg-base)',
                                                            }}
                                                        >
                                                            <Server size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-[14px] font-bold">
                                                                {asset.name}
                                                            </div>
                                                            <div
                                                                className="font-data mt-1 text-[10px]"
                                                                style={{
                                                                    color:
                                                                        'var(--text-tertiary)',
                                                                }}
                                                            >
                                                                {asset.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td
                                                    className="px-5 py-5 text-[13px] font-medium"
                                                    style={{
                                                        color:
                                                            'var(--text-secondary)',
                                                    }}
                                                >
                                                    {asset.category}
                                                </td>

                                                <td
                                                    className="font-data px-5 py-5 text-[13px] font-semibold"
                                                    style={{
                                                        color:
                                                            'var(--text-primary)',
                                                    }}
                                                >
                                                    {formatINR(asset.value)}
                                                </td>

                                                <td className="px-5 py-5">
                                                    <span
                                                        className="inline-flex border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                                                        style={{
                                                            background:
                                                                criticality.background,
                                                            color:
                                                                criticality.color,
                                                            borderColor:
                                                                criticality.border,
                                                        }}
                                                    >
                                                        {asset.criticality}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-5">
                                                    <span
                                                        className="inline-flex items-center gap-2 text-[12px] font-semibold"
                                                        style={{
                                                            color:
                                                                asset.internetExposed
                                                                    ? 'var(--status-danger-text)'
                                                                    : 'var(--text-secondary)',
                                                        }}
                                                    >
                                                        <span
                                                            className="h-2 w-2 rounded-full"
                                                            style={{
                                                                background:
                                                                    asset.internetExposed
                                                                        ? 'var(--risk-critical)'
                                                                        : 'var(--risk-safe)',
                                                            }}
                                                        />
                                                        {asset.internetExposed
                                                            ? 'Internet'
                                                            : 'Internal'}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-5 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(asset)
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center border-2 transition-colors"
                                                            style={{
                                                                borderColor:
                                                                    'var(--border-hairline)',
                                                                background:
                                                                    'var(--bg-surface)',
                                                                color:
                                                                    'var(--text-secondary)',
                                                            }}
                                                            aria-label={`Edit ${asset.name}`}
                                                        >
                                                            <Pencil size={14} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    asset.id,
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                asset.id
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center border-2 transition-colors"
                                                            style={{
                                                                borderColor:
                                                                    deletingId ===
                                                                        asset.id
                                                                        ? 'var(--border-hairline)'
                                                                        : '#FECACA',
                                                                background:
                                                                    'var(--bg-surface)',
                                                                color:
                                                                    deletingId ===
                                                                        asset.id
                                                                        ? 'var(--text-tertiary)'
                                                                        : 'var(--status-danger-text)',
                                                            }}
                                                            aria-label={`Delete ${asset.name}`}
                                                        >
                                                            {deletingId ===
                                                                asset.id ? (
                                                                <span className="font-data text-[10px]">
                                                                    ...
                                                                </span>
                                                            ) : (
                                                                <Trash2 size={14} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <footer
                    className="mt-5 flex flex-col gap-1 border-t-2 pt-4 text-[11px] sm:flex-row sm:items-center sm:justify-between"
                    style={{
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--text-tertiary)',
                    }}
                >
                    <span>CyberSpend AI · Asset Inventory</span>
                    <span className="font-data">
                        Risk engine input / live inventory
                    </span>
                </footer>
            </div>
        </div>
    )
}
