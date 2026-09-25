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

const RESERVED_OPTION_KEYS = ['page', 'size', 'sort']

export function getTasks(options) {
  const params = []

  if (options) {
    if (options.page !== null && options.page !== undefined) {
      params.push(`page=${encodeURIComponent(options.page)}`)
    }
    if (options.size !== null && options.size !== undefined) {
      params.push(`size=${encodeURIComponent(options.size)}`)
    }
    if (options.sort && options.sort.field && options.sort.direction) {
      const field = encodeURIComponent(options.sort.field)
      const direction = encodeURIComponent(options.sort.direction)
      params.push(`sort=${field},${direction}`)
    }

    for (const [key, value] of Object.entries(options)) {
      if (RESERVED_OPTION_KEYS.includes(key)) continue
      if (value === null || value === undefined) continue
      if (typeof value === 'object') continue
      if (typeof value === 'string' && value.trim() === '') continue
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }

  const query = params.length > 0 ? `?${params.join('&')}` : ''
  return fetch(`${BASE_URL}/tasks${query}`).then(handleResponse)
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
