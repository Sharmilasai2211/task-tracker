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

export function getTasks(options = undefined) {
  const url = new URL(`${BASE_URL}/tasks`)

  const reservedKeys = new Set(['page', 'size', 'sort'])

  const hasOptions = options != null && typeof options === 'object'
  if (!hasOptions) {
    return fetch(url.toString()).then(handleResponse)
  }

  // Paging
  if (options.page !== undefined && options.page !== null) {
    url.searchParams.set('page', String(options.page))
  }
  if (options.size !== undefined && options.size !== null) {
    url.searchParams.set('size', String(options.size))
  }

  // Sorting
  if (options.sort && typeof options.sort === 'object') {
    const field = options.sort.field
    const direction = options.sort.direction

    if (typeof field === 'string' && field.trim() !== '' && typeof direction === 'string' && direction.trim() !== '') {
      // Note: URLSearchParams may percent-encode the comma. If backend/tests require a literal comma,
      // we'll post-process below.
      url.searchParams.set('sort', `${field.trim()},${direction.trim()}`)
    }
  }

  // Filtering (minimum: status, title) + pass-through scalar keys
  for (const [key, value] of Object.entries(options)) {
    if (reservedKeys.has(key)) continue

    if (value === undefined || value === null) continue

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed === '') continue
      url.searchParams.set(key, trimmed)
      continue
    }

    // Only allow scalar types for pass-through filters to avoid ambiguous serialization.
    if (typeof value === 'number' || typeof value === 'boolean') {
      url.searchParams.set(key, String(value))
    }
  }

  // Ensure no trailing '?' when no query params were added.
  if ([...url.searchParams.keys()].length === 0) {
    return fetch(`${BASE_URL}/tasks`).then(handleResponse)
  }

  // Risk mitigation: keep comma in sort unencoded if possible.
  const urlString = url.toString().replace(/sort=([^&]*)%2C([^&]*)/g, 'sort=$1,$2')
  return fetch(urlString).then(handleResponse)
}

export function createTask(task) {
  return fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  }).then(handleResponse)
}

export function updateTask(id, task) {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  }).then(handleResponse)
}

export function deleteTask(id) {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  }).then(handleResponse)
}
