const BASE_URL = 'http://localhost:8050/api'

async function handleResponse(response) {
    if (response.status === 204) {
        return null
    }

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        const error = new Error(data?.message || `Request failed with status ${response.status}`)
        error.status = response.status
        error.fieldErrors = data?.fieldErrors ?? null
        throw error
    }

    return data
}

function isBlankString(value) {
    return typeof value === 'string' && value.trim().length === 0
}

function isScalar(value) {
    return (
        value === null ||
        value === undefined ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    )
}

/**
 * Fetch tasks with optional paging/sorting/filtering query params.
 *
 * Options:
 * - page?: number (supports 0)
 * - size?: number
 * - sort?: { field: string, direction: 'asc' | 'desc' | string }
 * - filters: status, title, plus any additional scalar key-values
 */
export function getTasks(options = undefined) {
    if (options == null || (typeof options === 'object' && Object.keys(options).length === 0)) {
        return fetch(`${BASE_URL}/tasks`).then(handleResponse)
    }

    const url = new URL(`${BASE_URL}/tasks`)
    const reservedKeys = new Set(['page', 'size', 'sort'])

    if (options.page !== undefined && options.page !== null) {
        url.searchParams.set('page', String(options.page))
    }

    if (options.size !== undefined && options.size !== null) {
        url.searchParams.set('size', String(options.size))
    }

    const sortField = options.sort?.field
    const sortDirection = options.sort?.direction
    const hasSort = typeof sortField === 'string' && sortField.trim() && typeof sortDirection === 'string' && sortDirection.trim()

    // Filters: include supported keys (status, title) plus any additional scalar keys.
    for (const [key, value] of Object.entries(options)) {
        if (reservedKeys.has(key)) continue
        if (value === undefined || value === null) continue
        if (isBlankString(value)) continue
        if (!isScalar(value)) continue

        url.searchParams.set(key, String(value))
    }

    // Risk note from plan: some URL builders encode commas in values. If that happens,
    // ensure the final URL contains an unencoded comma for the sort param.
    let finalUrl = url.toString()
    if (hasSort) {
        const sortValue = `${sortField.trim()},${String(sortDirection).trim().toLowerCase()}`
        if (finalUrl.includes('sort=')) {
            url.searchParams.set('sort', sortValue)
            finalUrl = url.toString()
        } else {
            const joiner = finalUrl.includes('?') ? '&' : '?'
            finalUrl = `${finalUrl}${joiner}sort=${sortValue}`
        }

        // If comma got encoded (%2C), replace it back to a literal comma.
        finalUrl = finalUrl.replace(/sort=([^&]*)/g, (match) => match.replace(/%2C/gi, ','))
    }

    // If we ended up with no query params after validation, keep backward-compatible URL.
    if (!finalUrl.includes('?')) {
        finalUrl = `${BASE_URL}/tasks`
    }

    return fetch(finalUrl).then(handleResponse)
}

export function createTask(task) {
    return fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(task),
    }).then(handleResponse)
}

export function updateTask(id, task) {
    return fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(task),
    }).then(handleResponse)
}

export function deleteTask(id) {
    return fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
    }).then(handleResponse)
}
