export type ParsedRow = Record<string, unknown>

export type SupportedFileType = 'csv' | 'json'

function getFileType(file: File): SupportedFileType {
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.csv')) {
        return 'csv'
    }

    if (fileName.endsWith('.json')) {
        return 'json'
    }

    throw new Error(
        'Unsupported file type. Please upload a CSV or JSON file.',
    )
}

function parseCSV(text: string): ParsedRow[] {
    const rows: string[][] = []

    let currentRow: string[] = []
    let currentValue = ''
    let insideQuotes = false

    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const nextChar = text[i + 1]

        // Escaped quote: ""
        if (char === '"' && nextChar === '"') {
            currentValue += '"'
            i++
            continue
        }

        // Opening / closing quote
        if (char === '"') {
            insideQuotes = !insideQuotes
            continue
        }

        // Column separator
        if (char === ',' && !insideQuotes) {
            currentRow.push(currentValue.trim())
            currentValue = ''
            continue
        }

        // New row
        if (
            (char === '\n' || char === '\r') &&
            !insideQuotes
        ) {
            // Windows CRLF
            if (char === '\r' && nextChar === '\n') {
                i++
            }

            currentRow.push(currentValue.trim())
            currentValue = ''

            if (
                currentRow.some(
                    (value) => value.trim() !== '',
                )
            ) {
                rows.push(currentRow)
            }

            currentRow = []
            continue
        }

        currentValue += char
    }

    // Add final row
    if (
        currentValue.length > 0 ||
        currentRow.length > 0
    ) {
        currentRow.push(currentValue.trim())

        if (
            currentRow.some(
                (value) => value.trim() !== '',
            )
        ) {
            rows.push(currentRow)
        }
    }

    if (rows.length < 2) {
        return []
    }

    const headers = rows[0]!.map((header) =>
        header.trim(),
    )

    return rows.slice(1).map((row) => {
        const result: ParsedRow = {}

        headers.forEach((header, index) => {
            if (!header) return

            result[header] = row[index] ?? ''
        })

        return result
    })
}

function parseJSON(
    text: string,
    expectedType?: string,
): ParsedRow[] {
    let data: unknown

    try {
        data = JSON.parse(text)
    } catch {
        throw new Error(
            'Invalid JSON file. Please upload valid JSON.',
        )
    }

    // Format:
    //
    // [
    //   {...},
    //   {...}
    // ]
    //
    if (Array.isArray(data)) {
        return validateObjectArray(data)
    }

    if (
        typeof data !== 'object' ||
        data === null
    ) {
        throw new Error(
            'JSON must contain an array of records.',
        )
    }

    const object = data as Record<
        string,
        unknown
    >

    // First try the expected type.
    //
    // {
    //   "assets": [...]
    // }
    //
    if (
        expectedType &&
        Array.isArray(object[expectedType])
    ) {
        return validateObjectArray(
            object[expectedType],
        )
    }

    // Try plural form.
    //
    // assets
    // vulnerabilities
    // controls
    //
    const possibleKeys = [
        expectedType,
        expectedType
            ? `${expectedType}s`
            : undefined,
    ].filter(
        (key): key is string =>
            Boolean(key),
    )

    for (const key of possibleKeys) {
        const value = object[key]

        if (Array.isArray(value)) {
            return validateObjectArray(value)
        }
    }

    // If there is only one array in the JSON object,
    // use that automatically.
    const arrayValues = Object.values(
        object,
    ).filter((value) => Array.isArray(value))

    if (arrayValues.length === 1) {
        return validateObjectArray(
            arrayValues[0],
        )
    }

    throw new Error(
        'Could not find a valid array of records in the JSON file.',
    )
}

function validateObjectArray(
    data: unknown,
): ParsedRow[] {
    if (!Array.isArray(data)) {
        throw new Error(
            'Expected an array of records.',
        )
    }

    const invalidIndex = data.findIndex(
        (item) =>
            typeof item !== 'object' ||
            item === null ||
            Array.isArray(item),
    )

    if (invalidIndex !== -1) {
        throw new Error(
            `Invalid record at row ${invalidIndex + 1}. Each record must be a JSON object.`,
        )
    }

    return data as ParsedRow[]
}

export async function parseDataFile(
    file: File,
    expectedType?: string,
): Promise<ParsedRow[]> {
    const fileType = getFileType(file)

    const text = await file.text()

    if (!text.trim()) {
        throw new Error(
            'The uploaded file is empty.',
        )
    }

    if (fileType === 'csv') {
        return parseCSV(text)
    }

    return parseJSON(
        text,
        expectedType,
    )
}

export function getColumns(
    rows: ParsedRow[],
): string[] {
    if (rows.length === 0) {
        return []
    }

    const columns = new Set<string>()

    rows.forEach((row) => {
        Object.keys(row).forEach((key) => {
            columns.add(key)
        })
    })

    return Array.from(columns)
}