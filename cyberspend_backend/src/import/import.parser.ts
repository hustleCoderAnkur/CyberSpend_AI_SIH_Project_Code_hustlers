import type { RawImportRow } from './import.types.js'

export interface ParsedImportFile {
    rows: RawImportRow[]
    format: 'csv' | 'json'
}

export interface ParseResult {
    success: boolean
    data: ParsedImportFile | null
    errors: Array<{
        field: string
        message: string
        value?: unknown
    }>
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    )
}

function normalizeHeader(
    value: string,
): string {
    return value
        .replace(/^\uFEFF/, '')
        .trim()
}

function parseCsvLine(
    line: string,
): string[] {
    const values: string[] = []

    let current = ''
    let insideQuotes = false

    for (
        let index = 0;
        index < line.length;
        index += 1
    ) {
        const character = line[index]

        if (character === '"') {
            if (
                insideQuotes &&
                line[index + 1] === '"'
            ) {
                current += '"'
                index += 1
                continue
            }

            insideQuotes = !insideQuotes
            continue
        }

        if (
            character === ',' &&
            !insideQuotes
        ) {
            values.push(current)
            current = ''
            continue
        }

        current += character
    }

    values.push(current)

    return values.map((value) =>
        value.trim(),
    )
}

function splitCsvRecords(
    content: string,
): string[] {
    const records: string[] = []

    let current = ''
    let insideQuotes = false

    for (
        let index = 0;
        index < content.length;
        index += 1
    ) {
        const character = content[index]

        if (character === '"') {
            if (
                insideQuotes &&
                content[index + 1] === '"'
            ) {
                current += '""'
                index += 1
                continue
            }

            insideQuotes = !insideQuotes
            current += character
            continue
        }

        if (
            (character === '\n' ||
                character === '\r') &&
            !insideQuotes
        ) {
            if (
                character === '\r' &&
                content[index + 1] === '\n'
            ) {
                index += 1
            }

            if (current.trim()) {
                records.push(current)
            }

            current = ''
            continue
        }

        current += character
    }

    if (current.trim()) {
        records.push(current)
    }

    return records
}

function parseCsv(
    content: string,
): ParseResult {
    const cleaned = content
        .replace(/^\uFEFF/, '')
        .trim()

    if (!cleaned) {
        return {
            success: false,
            data: null,
            errors: [
                {
                    field: 'file',
                    message:
                        'CSV file is empty.',
                },
            ],
        }
    }

    const records =
        splitCsvRecords(cleaned)

    if (records.length < 2) {
        return {
            success: false,
            data: null,
            errors: [
                {
                    field: 'file',
                    message:
                        'CSV file must contain a header and at least one data row.',
                },
            ],
        }
    }

    const headers = parseCsvLine(
        records[0],
    ).map(normalizeHeader)

    if (
        headers.length === 0 ||
        headers.every(
            (header) => !header,
        )
    ) {
        return {
            success: false,
            data: null,
            errors: [
                {
                    field: 'headers',
                    message:
                        'CSV file does not contain valid column headers.',
                },
            ],
        }
    }

    const duplicateHeaders =
        headers.filter(
            (header, index) =>
                header &&
                headers.indexOf(
                    header,
                ) !== index,
        )

    if (duplicateHeaders.length > 0) {
        return {
            success: false,
            data: null,
            errors: [
                {
                    field: 'headers',
                    message:
                        `Duplicate CSV columns found: ${Array.from(
                            new Set(
                                duplicateHeaders,
                            ),
                        ).join(', ')}`,
                },
            ],
        }
    }

    const rows: RawImportRow[] = []

    for (
        let recordIndex = 1;
        recordIndex < records.length;
        recordIndex += 1
    ) {
        const values = parseCsvLine(
            records[recordIndex],
        )

        const row: RawImportRow = {}

        for (
            let columnIndex = 0;
            columnIndex < headers.length;
            columnIndex += 1
        ) {
            const header =
                headers[columnIndex]

            if (!header) {
                continue
            }

            row[header] =
                values[columnIndex] ?? ''
        }

        const hasData =
            Object.values(row).some(
                (value) =>
                    String(value ?? '')
                        .trim()
                        .length > 0,
            )

        if (hasData) {
            rows.push(row)
        }
    }

    if (rows.length === 0) {
        return {
            success: false,
            data: null,
            errors: [
                {
                    field: 'rows',
                    message:
                        'CSV file contains no data rows.',
                },
            ],
        }
    }

    return {
        success: true,
        data: {
            rows,
            format: 'csv',
        },
        errors: [],
    }
}

function extractRows(
    value: unknown,
): RawImportRow[] {
    if (Array.isArray(value)) {
        return value.filter(
            isRecord,
        ) as RawImportRow[]
    }

    if (!isRecord(value)) {
        return []
    }

    const possibleKeys = [
        'data',
        'rows',
        'records',
        'items',
        'results',
        'assets',
        'vulnerabilities',
        'controls',
        'insiderThreat',
        'insiderThreatEvents',
    ]

    for (const key of possibleKeys) {
        const candidate =
            value[key]

        if (Array.isArray(candidate)) {
            const rows =
                candidate.filter(
                    isRecord,
                ) as RawImportRow[]

            if (rows.length > 0) {
                return rows
            }
        }
    }

    return [value]
}

function parseJson(
    content: string,
): ParseResult {
    const cleaned = content
        .replace(/^\uFEFF/, '')
        .trim()

    if (!cleaned) {
        return {
            success: false,
            data: null,
            errors: [
                {
                    field: 'file',
                    message:
                        'JSON file is empty.',
                },
            ],
        }
    }

    let parsed: unknown

    try {
        parsed = JSON.parse(cleaned)
    } catch (error) {
        return {
            success: false,
            data: null,
            errors: [
                {
                    field: 'file',
                    message:
                        error instanceof Error
                            ? `Invalid JSON: ${error.message}`
                            : 'Invalid JSON format.',
                },
            ],
        }
    }

    const rows =
        extractRows(parsed)

    if (rows.length === 0) {
        return {
            success: false,
            data: null,
            errors: [
                {
                    field: 'rows',
                    message:
                        'JSON file does not contain any valid records.',
                },
            ],
        }
    }

    return {
        success: true,
        data: {
            rows,
            format: 'json',
        },
        errors: [],
    }
}

function detectFormat(
    filename: string,
    content: string,
): 'csv' | 'json' | null {
    const lowerName =
        filename
            .toLowerCase()
            .trim()

    if (
        lowerName.endsWith('.csv')
    ) {
        return 'csv'
    }

    if (
        lowerName.endsWith('.json')
    ) {
        return 'json'
    }

    const trimmed =
        content.trim()

    if (
        trimmed.startsWith('{') ||
        trimmed.startsWith('[')
    ) {
        return 'json'
    }

    if (
        trimmed.includes(',') ||
        trimmed.includes('\n')
    ) {
        return 'csv'
    }

    return null
}

export function parseImportFile(
    filename: string,
    content: string,
): ParseResult {
    const format =
        detectFormat(
            filename,
            content,
        )

    if (!format) {
        return {
            success: false,
            data: null,
            errors: [
                {
                    field: 'file',
                    message:
                        'Unsupported file format. Only CSV and JSON files are currently supported.',
                },
            ],
        }
    }

    if (format === 'csv') {
        return parseCsv(content)
    }

    return parseJson(content)
}

export function parseImportContent(
    content: string,
    format: 'csv' | 'json',
): ParseResult {
    if (format === 'csv') {
        return parseCsv(content)
    }

    return parseJson(content)
}