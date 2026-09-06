import { apiFetch } from './client'

export interface ComplianceMapping {
    control: string
    frameworks: Record<string, string[]>
}

export function getComplianceMappings() {
    return apiFetch<ComplianceMapping[]>('/api/compliance')
}