import { apiFetch } from './client'

export interface WhatIfControl {
    id: string
    name: string
    category: string
    cost: number
    riskReductionPct: number
}

export interface WhatIfResult {
    selectedControls: WhatIfControl[]
    totalCost: number
    beforeEal: number
    afterEal: number
    savings: number
    rosi: number
}

export function simulateWhatIf(controlIds: string[]) {
    return apiFetch<WhatIfResult>('/what-if', {
        method: 'POST',
        body: JSON.stringify({
            controlIds,
        }),
    })
}