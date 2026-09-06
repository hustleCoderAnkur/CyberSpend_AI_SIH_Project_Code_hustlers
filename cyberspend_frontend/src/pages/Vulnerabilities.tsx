import { useEffect, useState } from 'react'
import {
    createVulnerability,
    deleteVulnerability,
    getVulnerabilities,
    updateVulnerability,
    type Vulnerability,
} from '../api/vulnerabilities'
import { getAssets, type Asset } from '../api/assets'

const emptyForm = {
    name: '',
    assetId: '',
    cvss: '',
    exploitAvailable: false,
    controlEffectiveness: '0',
}

function getCvssStyle(cvss: number) {
    if (cvss >= 9) {
        return {
            background: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
        }
    }

    if (cvss >= 7) {
        return {
            background: '#FFF7ED',
            color: '#C2410C',
        }
    }

    if (cvss >= 4) {
        return {
            background: 'var(--status-warning-bg)',
            color: 'var(--status-warning-text)',
        }
    }

    return {
        background: 'var(--status-success-bg)',
        color: 'var(--status-success-text)',
    }
}

export default function Vulnerabilities() {
    const [vulnerabilities, setVulnerabilities] = useState<
        Vulnerability[]
    >([])
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function loadData() {
        try {
            setLoading(true)
            setError('')

            const [vulnData, assetData] = await Promise.all([
                getVulnerabilities(),
                getAssets(),
            ])

            setVulnerabilities(vulnData)
            setAssets(assetData)

            if (!form.assetId && assetData.length > 0) {
                setForm((current) => ({
                    ...current,
                    assetId: assetData[0].id,
                }))
            }
        } catch {
            setError(
                'Failed to load vulnerability data. Please try again.',
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    function assetName(assetId: string) {
        return (
            assets.find((asset) => asset.id === assetId)?.name ??
            'Unknown asset'
        )
    }

    function openCreate() {
        setEditingId(null)

        setForm({
            ...emptyForm,
            assetId: assets[0]?.id ?? '',
        })

        setError('')
        setShowForm(true)
    }

    function openEdit(vulnerability: Vulnerability) {
        setEditingId(vulnerability.id)

        setForm({
            name: vulnerability.name,
            assetId: vulnerability.assetId,
            cvss: String(vulnerability.cvss),
            exploitAvailable: vulnerability.exploitAvailable,
            controlEffectiveness: String(
                vulnerability.controlEffectiveness,
            ),
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
        const cvss = Number(form.cvss)
        const controlEffectiveness = Number(
            form.controlEffectiveness,
        )

        if (!name) {
            setError('Vulnerability name is required.')
            return
        }

        if (!form.assetId) {
            setError('Select an affected asset.')
            return
        }

        if (!Number.isFinite(cvss) || cvss < 0 || cvss > 10) {
            setError('CVSS must be between 0 and 10.')
            return
        }

        if (
            !Number.isFinite(controlEffectiveness) ||
            controlEffectiveness < 0 ||
            controlEffectiveness > 1
        ) {
            setError(
                'Control effectiveness must be between 0 and 1.',
            )
            return
        }

        try {
            setSaving(true)

            if (editingId) {
                await updateVulnerability(editingId, {
                    name,
                    assetId: form.assetId,
                    cvss,
                    exploitAvailable: form.exploitAvailable,
                    controlEffectiveness,
                })
            } else {
                await createVulnerability({
                    id: `V-${crypto.randomUUID().slice(0, 8)}`,
                    name,
                    assetId: form.assetId,
                    cvss,
                    exploitAvailable: form.exploitAvailable,
                    controlEffectiveness,
                })
            }

            closeForm()
            await loadData()
        } catch {
            setError(
                editingId
                    ? 'Failed to update vulnerability. Please try again.'
                    : 'Failed to create vulnerability. Please try again.',
            )
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        const confirmed = window.confirm(
            'Delete this vulnerability?',
        )

        if (!confirmed) return

        try {
            setDeletingId(id)
            setError('')

            await deleteVulnerability(id)
            await loadData()
        } catch {
            setError(
                'Failed to delete vulnerability. Please try again.',
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
                                Vulnerabilities
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
                                    {vulnerabilities.length}
                                </span>
                            )}
                        </div>

                        <p
                            className="mt-1 text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Track vulnerabilities affecting company assets.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        disabled={assets.length === 0}
                        className="px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors"
                        style={{
                            background:
                                assets.length === 0
                                    ? 'var(--bg-surface-raised)'
                                    : 'var(--accent-action)',
                            color:
                                assets.length === 0
                                    ? 'var(--text-tertiary)'
                                    : 'var(--text-inverse)',
                            borderRadius: 'var(--radius-sm)',
                        }}
                    >
                        + Add Vulnerability
                    </button>
                </header>

                {/* No assets warning */}
                {assets.length === 0 && !loading && (
                    <div
                        className="mt-5 border-2 px-4 py-3"
                        style={{
                            borderColor: '#FDE68A',
                            background: 'var(--status-warning-bg)',
                            borderRadius: 'var(--radius-md)',
                        }}
                    >
                        <p
                            className="text-[13px] font-bold"
                            style={{ color: 'var(--status-warning-text)' }}
                        >
                            No assets available
                        </p>

                        <p
                            className="mt-0.5 text-[11px]"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Add at least one asset before creating a
                            vulnerability.
                        </p>
                    </div>
                )}

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
                                onClick={loadData}
                                className="shrink-0 text-[12px] font-bold underline underline-offset-2"
                                style={{ color: 'var(--status-danger-text)' }}
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
                                    ? 'Edit Vulnerability'
                                    : 'Add Vulnerability'}
                            </h2>

                            <p
                                className="mt-0.5 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Record the vulnerability and its current
                                mitigation status.
                            </p>
                        </div>

                        <div className="grid gap-5 p-5 md:grid-cols-2">
                            {/* Vulnerability name */}
                            <div>
                                <label
                                    htmlFor="vulnerability-name"
                                    className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Vulnerability Name
                                </label>

                                <input
                                    id="vulnerability-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            name: event.target.value,
                                        })
                                    }
                                    placeholder="Unpatched PostgreSQL CVE"
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

                            {/* Affected asset */}
                            <div>
                                <label
                                    htmlFor="affected-asset"
                                    className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Affected Asset
                                </label>

                                <select
                                    id="affected-asset"
                                    value={form.assetId}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            assetId: event.target.value,
                                        })
                                    }
                                    className="w-full border-2 px-3 py-2.5 text-[13px] outline-none"
                                    style={{
                                        borderColor: 'var(--border-hairline)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}
                                >
                                    <option value="">Select asset</option>

                                    {assets.map((asset) => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* CVSS */}
                            <div>
                                <label
                                    htmlFor="cvss-score"
                                    className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    CVSS Score
                                </label>

                                <input
                                    id="cvss-score"
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={form.cvss}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            cvss: event.target.value,
                                        })
                                    }
                                    placeholder="9.8"
                                    className="font-data w-full border-2 px-3 py-2.5 text-[13px] outline-none transition-colors"
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

                                <p
                                    className="mt-1 text-[11px]"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Score from 0.0 to 10.0.
                                </p>
                            </div>

                            {/* Control effectiveness */}
                            <div>
                                <label
                                    htmlFor="control-effectiveness"
                                    className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Control Effectiveness
                                </label>

                                <input
                                    id="control-effectiveness"
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={form.controlEffectiveness}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            controlEffectiveness:
                                                event.target.value,
                                        })
                                    }
                                    placeholder="0.2"
                                    className="font-data w-full border-2 px-3 py-2.5 text-[13px] outline-none transition-colors"
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

                                <p
                                    className="mt-1 text-[11px]"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Enter 0 to 1. Example: 0.20 = 20%.
                                </p>
                            </div>
                        </div>

                        {/* Exploit toggle */}
                        <div className="px-5 pb-5">
                            <label
                                className="inline-flex cursor-pointer items-center gap-2.5"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <input
                                    type="checkbox"
                                    checked={form.exploitAvailable}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            exploitAvailable:
                                                event.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 accent-black"
                                />

                                <span className="text-[13px] font-medium">
                                    Exploit publicly available
                                </span>
                            </label>

                            <p
                                className="ml-6 mt-1 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Mark this when a known public exploit exists
                                for the vulnerability.
                            </p>
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
                                        ? 'Update Vulnerability'
                                        : 'Create Vulnerability'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Inventory */}
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
                                Vulnerability Inventory
                            </h2>

                            <p
                                className="mt-0.5 text-[11px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Known security weaknesses across company
                                assets.
                            </p>
                        </div>

                        {!loading && vulnerabilities.length > 0 && (
                            <span
                                className="font-data text-[11px] font-semibold"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                {vulnerabilities.length} total
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
                    ) : vulnerabilities.length === 0 ? (
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
                                No vulnerabilities yet
                            </h3>

                            <p
                                className="mx-auto mt-1 max-w-sm text-[12px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Add a vulnerability to start tracking
                                security exposure across your assets.
                            </p>

                            {assets.length > 0 && (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="mt-4 border-2 px-3 py-2 text-[12px] font-bold uppercase tracking-wide"
                                    style={{
                                        borderColor:
                                            'var(--border-strong)',
                                        background: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}
                                >
                                    Add first vulnerability
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-212.5 text-left">
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
                                            Vulnerability
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                            style={{
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            Asset
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                            style={{
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            CVSS
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                            style={{
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            Exploit
                                        </th>

                                        <th
                                            className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide"
                                            style={{
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            Control
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
                                    {vulnerabilities.map((vulnerability) => {
                                        const cvssStyle = getCvssStyle(
                                            vulnerability.cvss,
                                        )

                                        return (
                                            <tr
                                                key={vulnerability.id}
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
                                                {/* Vulnerability */}
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <div
                                                            className="text-[13px] font-semibold"
                                                            style={{
                                                                color:
                                                                    'var(--text-primary)',
                                                            }}
                                                        >
                                                            {vulnerability.name}
                                                        </div>

                                                        <div
                                                            className="font-data mt-0.5 text-[10px]"
                                                            style={{
                                                                color:
                                                                    'var(--text-tertiary)',
                                                            }}
                                                        >
                                                            {vulnerability.id}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Asset */}
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <div
                                                            className="text-[12px]"
                                                            style={{
                                                                color:
                                                                    'var(--text-secondary)',
                                                            }}
                                                        >
                                                            {assetName(
                                                                vulnerability.assetId,
                                                            )}
                                                        </div>

                                                        <div
                                                            className="font-data mt-0.5 text-[10px]"
                                                            style={{
                                                                color:
                                                                    'var(--text-tertiary)',
                                                            }}
                                                        >
                                                            {vulnerability.assetId}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* CVSS */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className="font-data inline-flex rounded-full px-2 py-1 text-[10px] font-bold"
                                                        style={{
                                                            background:
                                                                cvssStyle.background,
                                                            color: cvssStyle.color,
                                                        }}
                                                    >
                                                        {vulnerability.cvss.toFixed(1)}
                                                    </span>
                                                </td>

                                                {/* Exploit */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                                                        style={{
                                                            color:
                                                                vulnerability.exploitAvailable
                                                                    ? 'var(--status-danger-text)'
                                                                    : 'var(--text-secondary)',
                                                        }}
                                                    >
                                                        <span
                                                            className="h-1.5 w-1.5 rounded-full"
                                                            style={{
                                                                background:
                                                                    vulnerability.exploitAvailable
                                                                        ? 'var(--risk-critical)'
                                                                        : 'var(--risk-safe)',
                                                            }}
                                                        />

                                                        {vulnerability.exploitAvailable
                                                            ? 'Available'
                                                            : 'None known'}
                                                    </span>
                                                </td>

                                                {/* Control */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-1.5 w-16 overflow-hidden rounded-full"
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
                                                                            vulnerability.controlEffectiveness *
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
                                                            className="font-data text-[11px] font-semibold"
                                                            style={{
                                                                color:
                                                                    'var(--text-secondary)',
                                                            }}
                                                        >
                                                            {Math.round(
                                                                vulnerability.controlEffectiveness *
                                                                100,
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(vulnerability)
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
                                                            handleDelete(
                                                                vulnerability.id,
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            vulnerability.id
                                                        }
                                                        className="text-[12px] font-bold"
                                                        style={{
                                                            color:
                                                                deletingId ===
                                                                    vulnerability.id
                                                                    ? 'var(--text-tertiary)'
                                                                    : 'var(--status-danger-text)',
                                                        }}
                                                    >
                                                        {deletingId ===
                                                            vulnerability.id
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