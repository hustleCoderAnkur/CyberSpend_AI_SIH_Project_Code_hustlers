const API_URL = import.meta.env.VITE_API_URL

export async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        },
    )

    if (!response.ok) {
        let message = `API request failed: ${response.status} ${response.statusText}`

        try {
            const errorData = await response.json()

            if (
                errorData &&
                typeof errorData.message === 'string'
            ) {
                message = errorData.message
            } else if (
                errorData &&
                typeof errorData.error === 'string'
            ) {
                message = errorData.error
            }
        } catch {
            // Keep the default HTTP error message.
        }

        throw new Error(message)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return response.json()
}