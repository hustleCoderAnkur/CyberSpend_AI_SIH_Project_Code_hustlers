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
    return apiFetch<Asset[]>('/api/assets')
}

export function createAsset(
    asset: Omit<Asset, 'createdAt'>,
) {
    return apiFetch<Asset>('/api/assets', {
        method: 'POST',
        body: JSON.stringify(asset),
    })
}

export function updateAsset(
    id: string,
    asset: Partial<Omit<Asset, 'id' | 'createdAt'>>,
) {
    return apiFetch<Asset>(`/api/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(asset),
    })
}

export function deleteAsset(id: string) {
    return apiFetch<void>(`/api/assets/${id}`, {
        method: 'DELETE',
    })
}