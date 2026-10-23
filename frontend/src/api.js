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

const RESERVED_OPTION_KEYS = new Set(['page', 'size', 'sort'])

export function buildTasksQuery(options = {}) {
  const params = new URLSearchParams()

  if (options.page !== null && options.page !== undefined) {
    params.set('page', options.page)
  }

  if (options.size !== null && options.size !== undefined) {
    params.set('size', options.size)
  }

  if (options.sort && options.sort.field) {
    const direction = options.sort.direction || 'asc'
    params.set('sort', `${options.sort.field},${direction}`)
  }

  for (const [key, value] of Object.entries(options)) {
    if (RESERVED_OPTION_KEYS.has(key) || key === 'sort') {
      continue
    }

    if (value === null || value === undefined) {
      continue
    }

    if (typeof value === 'object') {
      continue
    }

    if (typeof value === 'string' && value.trim() === '') {
      continue
    }

    params.set(key, value)
  }

  const query = params.toString().replace(/%2C/g, ',')
  return query ? `?${query}` : ''
}

export function getTasks(options) {
  const query = buildTasksQuery(options)
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
