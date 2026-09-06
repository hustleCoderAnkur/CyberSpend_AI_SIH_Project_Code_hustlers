import { apiFetch } from './client'

export interface Control {
    id: string
    name: string
    category: string
    cost: number
    riskReductionPct: number
}

export function getControls() {
    return apiFetch<Control[]>('/api/controls')
}

export function createControl(
    control: Control,
) {
    return apiFetch<Control>('/api/controls', {
        method: 'POST',
        body: JSON.stringify(control),
    })
}

export function updateControl(
    id: string,
    control: Partial<Omit<Control, 'id'>>,
) {
    return apiFetch<Control>(`/api/controls/${id}`, {
        method: 'PUT',
        body: JSON.stringify(control),
    })
}

export async function deleteControl(id: string) {
    const response = await fetch(
        `${import.meta.env.API_URL}/api/controls/${id}`,
        {
            method: 'DELETE',
        },
    )

    if (!response.ok) {
        throw new Error('Failed to delete control')
    }
}