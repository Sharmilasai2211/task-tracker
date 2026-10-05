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
  if (!options || Object.keys(options).length === 0) {
    return fetch(`${BASE_URL}/tasks`).then(handleResponse)
  }

  const { page, size, sort, ...filters } = options
  const params = new URLSearchParams()

  if (page !== undefined && page !== null) {
    params.set('page', String(page))
  }

  if (size !== undefined && size !== null) {
    params.set('size', String(size))
  }

  if (sort?.field && sort?.direction) {
    params.set('sort', `${sort.field},${sort.direction}`)
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'string' && value.trim() === '') continue
    params.set(key, String(value))
  }

  const query = params.toString()
  return fetch(query ? `${BASE_URL}/tasks?${query}` : `${BASE_URL}/tasks`).then(handleResponse)
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
