import { apiFetch } from './client'

export interface Asset {
    id: string
    name: string
    category: string
    value: number
    criticality:
    | 'Low'
    | 'Medium'
    | 'High'
    | 'Critical'
    internetExposed: boolean
    createdAt: string
}

export function getAssets() {
    return apiFetch<Asset[]>('/assets')
}

export function createAsset(
    asset: Omit<Asset, 'createdAt'>,
) {
    return apiFetch<Asset>('/assets', {
        method: 'POST',
        body: JSON.stringify(asset),
    })
}

export function updateAsset(
    id: string,
    asset: Partial<Omit<Asset, 'id' | 'createdAt'>>,
) {
    return apiFetch<Asset>(`/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(asset),
    })
}

export async function deleteAsset(id: string) {
    const response = await fetch(
        `${import.meta.env.API_URL}/assets/${id}`,
        {
            method: 'DELETE',
        },
    )

    if (!response.ok) {
        throw new Error('Failed to delete asset')
    }
}