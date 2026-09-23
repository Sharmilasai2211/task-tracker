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

export function getTasks(options) {
  const params = new URLSearchParams()

  if (options) {
    const { page, size, sort, ...filters } = options

    if (page !== undefined && page !== null) {
      params.set('page', page)
    }

    if (size !== undefined && size !== null) {
      params.set('size', size)
    }

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue
      if (typeof value === 'object' || typeof value === 'function') continue
      if (typeof value === 'string' && value.trim() === '') continue
      params.set(key, value)
    }
  }

  let query = params.toString()

  const field = options?.sort?.field
  const direction = options?.sort?.direction
  if (typeof field === 'string' && field.trim() !== '' && direction) {
    // URLSearchParams percent-encodes the comma; build this segment manually
    // so the backend receives `sort=field,direction` unencoded.
    const sortParam = `sort=${field},${String(direction).toLowerCase()}`
    query = query ? `${query}&${sortParam}` : sortParam
  }

  const url = query ? `${BASE_URL}/tasks?${query}` : `${BASE_URL}/tasks`
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
