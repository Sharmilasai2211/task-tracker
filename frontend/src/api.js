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

const RESERVED_KEYS = new Set(['page', 'size', 'sort'])

function isUsableScalar(value) {
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'number') return Number.isFinite(value)
  return typeof value === 'boolean'
}

function buildTasksQuery(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) return ''

  const parts = []
  const add = (key, value) =>
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)

  if (isUsableScalar(options.page)) add('page', options.page)
  if (isUsableScalar(options.size)) add('size', options.size)

  const { field, direction } = options.sort ?? {}
  if (isUsableScalar(field) && isUsableScalar(direction)) {
    // Comma is left unencoded so the server sees `sort=field,direction`.
    parts.push(`sort=${encodeURIComponent(field)},${encodeURIComponent(direction)}`)
  }

  for (const [key, value] of Object.entries(options)) {
    if (!RESERVED_KEYS.has(key) && isUsableScalar(value)) add(key, value)
  }

  return parts.length ? `?${parts.join('&')}` : ''
}

export function getTasks(options) {
  return fetch(`${BASE_URL}/tasks${buildTasksQuery(options)}`).then(handleResponse)
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
