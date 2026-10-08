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

export function deleteControl(id: string) {
    return apiFetch<void>(`/api/controls/${id}`, {
        method: 'DELETE',
    })
}