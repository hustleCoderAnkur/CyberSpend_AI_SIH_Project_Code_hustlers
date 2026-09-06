import { apiFetch } from './client'

export interface Vulnerability {
    id: string
    assetId: string
    name: string
    cvss: number
    exploitAvailable: boolean
    controlEffectiveness: number
    discoveredOn: string
}

export function getVulnerabilities() {
    return apiFetch<Vulnerability[]>('/api/vulnerabilities')
}

export function createVulnerability(
    vulnerability: Omit<Vulnerability, 'discoveredOn'>,
) {
    return apiFetch<Vulnerability>('/api/vulnerabilities', {
        method: 'POST',
        body: JSON.stringify(vulnerability),
    })
}

export function updateVulnerability(
    id: string,
    vulnerability: Partial<
        Omit<Vulnerability, 'id' | 'discoveredOn'>
    >,
) {
    return apiFetch<Vulnerability>(
        `/api/vulnerabilities/${id}`,
        {
            method: 'PUT',
            body: JSON.stringify(vulnerability),
        },
    )
}

export async function deleteVulnerability(id: string) {
    const response = await fetch(
        `${import.meta.env.API_URL}/vulnerabilities/${id}`,
        {
            method: 'DELETE',
        },
    )

    if (!response.ok) {
        throw new Error('Failed to delete vulnerability')
    }
}