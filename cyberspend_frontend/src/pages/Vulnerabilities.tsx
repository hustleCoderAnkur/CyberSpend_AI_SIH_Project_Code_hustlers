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

export default function Vulnerabilities() {
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    async function loadData() {
        try {
            setLoading(true)

            const [vulnData, assetData] =
                await Promise.all([
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
            setError('Failed to load vulnerability data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    function assetName(assetId: string) {
        return (
            assets.find((asset) => asset.id === assetId)
                ?.name ?? 'Unknown asset'
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
            exploitAvailable:
                vulnerability.exploitAvailable,
            controlEffectiveness:
                String(vulnerability.controlEffectiveness),
        })

        setError('')
        setShowForm(true)
    }

    async function handleSubmit(
        event: React.FormEvent,
    ) {
        event.preventDefault()
        setError('')

        const cvss = Number(form.cvss)
        const controlEffectiveness =
            Number(form.controlEffectiveness)

        if (!form.name.trim()) {
            setError('Vulnerability name is required')
            return
        }

        if (!form.assetId) {
            setError('Select an asset')
            return
        }

        if (cvss < 0 || cvss > 10) {
            setError('CVSS must be between 0 and 10')
            return
        }

        if (
            controlEffectiveness < 0 ||
            controlEffectiveness > 1
        ) {
            setError(
                'Control effectiveness must be between 0 and 1',
            )
            return
        }

        try {
            if (editingId) {
                await updateVulnerability(
                    editingId,
                    {
                        name: form.name.trim(),
                        assetId: form.assetId,
                        cvss,
                        exploitAvailable:
                            form.exploitAvailable,
                        controlEffectiveness,
                    },
                )
            } else {
                await createVulnerability({
                    id: `V-${crypto.randomUUID().slice(0, 8)}`,
                    name: form.name.trim(),
                    assetId: form.assetId,
                    cvss,
                    exploitAvailable:
                        form.exploitAvailable,
                    controlEffectiveness,
                })
            }

            setShowForm(false)
            await loadData()
        } catch {
            setError('Failed to save vulnerability')
        }
    }

    async function handleDelete(id: string) {
        if (
            !window.confirm(
                'Delete this vulnerability?',
            )
        ) {
            return
        }

        try {
            await deleteVulnerability(id)
            await loadData()
        } catch {
            setError('Failed to delete vulnerability')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">
                        Vulnerabilities
                    </h1>

                    <p className="mt-1 text-sm text-slate-400">
                        Track vulnerabilities affecting company assets.
                    </p>
                </div>

                <button
                    onClick={openCreate}
                    disabled={assets.length === 0}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    + Add Vulnerability
                </button>
            </div>

            {assets.length === 0 && !loading && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-400">
                    Add at least one asset before creating a vulnerability.
                </div>
            )}

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
                            ? 'Edit Vulnerability'
                            : 'Add Vulnerability'}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Vulnerability Name
                            </label>

                            <input
                                value={form.name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Unpatched PostgreSQL CVE"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Affected Asset
                            </label>

                            <select
                                value={form.assetId}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        assetId: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            >
                                <option value="">
                                    Select asset
                                </option>

                                {assets.map((asset) => (
                                    <option
                                        key={asset.id}
                                        value={asset.id}
                                    >
                                        {asset.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                CVSS Score
                            </label>

                            <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={form.cvss}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        cvss: e.target.value,
                                    })
                                }
                                placeholder="9.8"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-slate-400">
                                Control Effectiveness
                            </label>

                            <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.05"
                                value={form.controlEffectiveness}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        controlEffectiveness:
                                            e.target.value,
                                    })
                                }
                                placeholder="0.2"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />

                            <p className="mt-1 text-xs text-slate-500">
                                Enter 0 to 1. Example: 0.20 = 20%.
                            </p>
                        </div>
                    </div>

                    <label className="mt-4 flex items-center gap-3 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={form.exploitAvailable}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    exploitAvailable:
                                        e.target.checked,
                                })
                            }
                        />

                        Exploit publicly available
                    </label>

                    <div className="mt-5 flex gap-3">
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                        >
                            {editingId
                                ? 'Update Vulnerability'
                                : 'Create Vulnerability'}
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
                        Vulnerability Inventory
                    </h2>
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-slate-400">
                        Loading vulnerabilities...
                    </div>
                ) : vulnerabilities.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        No vulnerabilities added yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-800 text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">
                                        Vulnerability
                                    </th>
                                    <th className="px-5 py-3">
                                        Asset
                                    </th>
                                    <th className="px-5 py-3">
                                        CVSS
                                    </th>
                                    <th className="px-5 py-3">
                                        Exploit
                                    </th>
                                    <th className="px-5 py-3">
                                        Control
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {vulnerabilities.map(
                                    (vulnerability) => (
                                        <tr
                                            key={vulnerability.id}
                                            className="border-b border-slate-800 last:border-0"
                                        >
                                            <td className="px-5 py-4 font-medium text-white">
                                                {vulnerability.name}
                                            </td>

                                            <td className="px-5 py-4 text-slate-400">
                                                {assetName(
                                                    vulnerability.assetId,
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-slate-300">
                                                {vulnerability.cvss.toFixed(1)}
                                            </td>

                                            <td className="px-5 py-4">
                                                {vulnerability.exploitAvailable
                                                    ? 'Yes'
                                                    : 'No'}
                                            </td>

                                            <td className="px-5 py-4 text-slate-400">
                                                {Math.round(
                                                    vulnerability.controlEffectiveness *
                                                    100,
                                                )}
                                                %
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() =>
                                                        openEdit(
                                                            vulnerability,
                                                        )
                                                    }
                                                    className="mr-3 text-xs text-blue-400"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            vulnerability.id,
                                                        )
                                                    }
                                                    className="text-xs text-red-400"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}