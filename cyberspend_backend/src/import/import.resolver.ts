import type {
    NormalizedAsset,
    NormalizedVulnerability,
} from './import.types.js'

export interface ResolvedVulnerability
    extends NormalizedVulnerability {
    assetId: string
}

export interface ResolveResult {
    assets: NormalizedAsset[]
    vulnerabilities: ResolvedVulnerability[]
    createdAssets: number
    unresolvedVulnerabilities: Array<{
        vulnerabilityId: string
        assetReference: string
    }>
}

function normalizeReference(
    value: unknown,
): string {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[\s\-_.]+/g, '')
}

function generateAssetId(
    index: number,
): string {
    return `AST-AUTO-${String(index + 1).padStart(6, '0')}`
}

function findAsset(
    reference: string,
    assets: NormalizedAsset[],
): NormalizedAsset | undefined {
    const normalizedReference =
        normalizeReference(reference)

    if (!normalizedReference) {
        return undefined
    }

    return assets.find((asset) => {
        const idMatch =
            normalizeReference(asset.id) ===
            normalizedReference

        const nameMatch =
            normalizeReference(asset.name) ===
            normalizedReference

        return idMatch || nameMatch
    })
}

function createUnknownAsset(
    reference: string,
    index: number,
): NormalizedAsset {
    const cleanReference =
        String(reference ?? '').trim()

    return {
        id: generateAssetId(index),
        name:
            cleanReference ||
            `Imported Asset ${index + 1}`,
        category: 'Uncategorized',
        value: 0,
        criticality: 'Medium',
        internetExposed: false,
    }
}

export function resolveVulnerabilityAssets(
    assets: NormalizedAsset[],
    vulnerabilities: NormalizedVulnerability[],
): ResolveResult {
    const resolvedAssets = [...assets]
    const resolvedVulnerabilities: ResolvedVulnerability[] =
        []

    const unresolvedVulnerabilities: Array<{
        vulnerabilityId: string
        assetReference: string
    }> = []

    let createdAssets = 0

    for (
        let index = 0;
        index < vulnerabilities.length;
        index += 1
    ) {
        const vulnerability =
            vulnerabilities[index]

        const reference =
            String(vulnerability.assetId ?? '').trim()

        let asset = findAsset(
            reference,
            resolvedAssets,
        )

        /*
         * If the vulnerability contains no asset
         * reference, create an automatic asset.
         */
        if (!asset && !reference) {
            asset = createUnknownAsset(
                `Imported Asset ${index + 1}`,
                resolvedAssets.length,
            )

            resolvedAssets.push(asset)
            createdAssets += 1
        }

        /*
         * If the referenced asset does not exist,
         * automatically create it instead of
         * rejecting the complete import.
         */
        if (!asset && reference) {
            asset = createUnknownAsset(
                reference,
                resolvedAssets.length,
            )

            resolvedAssets.push(asset)
            createdAssets += 1
        }

        if (!asset) {
            unresolvedVulnerabilities.push({
                vulnerabilityId:
                    vulnerability.id,
                assetReference: reference,
            })

            continue
        }

        resolvedVulnerabilities.push({
            ...vulnerability,
            assetId: asset.id,
        })
    }

    return {
        assets: resolvedAssets,
        vulnerabilities:
            resolvedVulnerabilities,
        createdAssets,
        unresolvedVulnerabilities,
    }
}

export function resolveAssetReference(
    reference: string,
    assets: NormalizedAsset[],
): string | null {
    const asset = findAsset(
        reference,
        assets,
    )

    return asset?.id ?? null
}

export function ensureAsset(
    reference: string,
    assets: NormalizedAsset[],
): {
    asset: NormalizedAsset
    created: boolean
} {
    const existing = findAsset(
        reference,
        assets,
    )

    if (existing) {
        return {
            asset: existing,
            created: false,
        }
    }

    const asset =
        createUnknownAsset(
            reference,
            assets.length,
        )

    assets.push(asset)

    return {
        asset,
        created: true,
    }
}