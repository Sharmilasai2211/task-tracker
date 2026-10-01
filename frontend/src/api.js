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
  const baseUrl = new URL(`${BASE_URL}/tasks`)

  if (!options) {
    return fetch(baseUrl.toString()).then(handleResponse)
  }

  const reservedKeys = new Set(['page', 'size', 'sort'])
  const params = baseUrl.searchParams

  // Paging
  if (options.page !== null && options.page !== undefined) {
    params.set('page', String(options.page))
  }
  if (options.size !== null && options.size !== undefined) {
    params.set('size', String(options.size))
  }

  // Sorting
  let sortParam = null
  if (options.sort && typeof options.sort === 'object') {
    const field = options.sort.field
    const direction = options.sort.direction

    if (typeof field === 'string' && field.trim() && typeof direction === 'string' && direction.trim()) {
      // NOTE: URLSearchParams may encode commas (%2C). We'll append sort manually to keep a literal comma.
      sortParam = `${field.trim()},${direction.trim()}`
    }
  }

  // Filtering (+ optional scalar pass-through)
  for (const [key, value] of Object.entries(options)) {
    if (reservedKeys.has(key)) continue
    if (value === null || value === undefined) continue

    if (typeof value === 'string') {
      if (!value.trim()) continue
      params.set(key, value)
      continue
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      params.set(key, String(value))
    }
  }

  let url = baseUrl.toString()
  if (sortParam) {
    const joiner = url.includes('?') ? '&' : '?'
    url = `${url}${joiner}sort=${encodeURIComponent(sortParam).replace(/%2C/g, ',')}`
  }

  return fetch(url).then(handleResponse)
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
