import { apiFetch } from './client'

export interface ImportStats {
    assets: number
    vulnerabilities: number
    controls: number
    insiderThreatEvents: number
    generic: number
    total: number
}

export interface ImportResponse {
    success: boolean
    message?: string
    error?: unknown
    imported?: ImportStats
    detection?: {
        type: string | null
        confidence: number
        matchedFields: string[]
    }
    created?: {
        assets: number
    }
    errors?: unknown[]
}

export interface ImportValidationResponse {
    valid: boolean
    message?: string
    errors?: unknown[]

    detection?: {
        type: string | null
        confidence: number
        matchedFields: string[]
    }

    totalRows?: number

    assets?: number
    vulnerabilities?: number
    controls?: number
    insiderThreatEvents?: number
    generic?: number
    createdAssets?: number
}

export function validateImportFile(
    filename: string,
    content: string,
) {
    return apiFetch<ImportValidationResponse>(
        '/api/import/file/validate',
        {
            method: 'POST',
            body: JSON.stringify({
                filename,
                content,
            }),
        },
    )
}

export function importFile(
    filename: string,
    content: string,
) {
    return apiFetch<ImportResponse>(
        '/api/import/file',
        {
            method: 'POST',
            body: JSON.stringify({
                filename,
                content,
            }),
        },
    )
}

export function validateMixedImportFile(
    filename: string,
    content: string,
) {
    return apiFetch<ImportValidationResponse>(
        '/api/import/file/mixed/validate',
        {
            method: 'POST',
            body: JSON.stringify({
                filename,
                content,
            }),
        },
    )
}

export function importMixedFile(
    filename: string,
    content: string,
) {
    return apiFetch<ImportResponse>(
        '/api/import/file/mixed',
        {
            method: 'POST',
            body: JSON.stringify({
                filename,
                content,
            }),
        },
    )
}

export function refreshRisk() {
    return apiFetch('/api/risk')
}