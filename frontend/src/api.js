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

const RESERVED_KEYS = ['page', 'size', 'sort']
const isScalar = (v) => ['string', 'number', 'boolean'].includes(typeof v)
const isBlank = (v) => typeof v === 'string' && v.trim() === ''

function buildTasksQuery(options) {
  if (!options || typeof options !== 'object') return ''

  const parts = []
  const add = (key, value) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)

  for (const key of ['page', 'size']) {
    if (options[key] !== null && options[key] !== undefined) add(key, options[key])
  }

  const { field, direction } = options.sort ?? {}
  if (typeof field === 'string' && field.trim() && typeof direction === 'string' && direction.trim()) {
    parts.push(`sort=${encodeURIComponent(field)},${encodeURIComponent(direction)}`)
  }

  for (const [key, value] of Object.entries(options)) {
    if (RESERVED_KEYS.includes(key) || !isScalar(value) || isBlank(value)) continue
    add(key, value)
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
