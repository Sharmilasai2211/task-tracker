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

function isPresent(value) {
  return value !== null && value !== undefined
}

function buildTasksQuery(options) {
  const parts = []
  const add = (key, value) =>
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)

  if (!options || typeof options !== 'object') {
    return ''
  }

  const { page, size, sort, ...filters } = options

  if (isPresent(page)) add('page', page)
  if (isPresent(size)) add('size', size)

  const field = typeof sort?.field === 'string' ? sort.field.trim() : ''
  const direction = typeof sort?.direction === 'string' ? sort.direction.trim() : ''
  if (field && direction) {
    // Comma is kept literal so the URL reads sort=title,asc
    parts.push(`sort=${encodeURIComponent(field)},${encodeURIComponent(direction)}`)
  }

  for (const [key, value] of Object.entries(filters)) {
    if (RESERVED_KEYS.has(key) || !isPresent(value)) continue
    if (!['string', 'number', 'boolean'].includes(typeof value)) continue
    if (typeof value === 'string' && value.trim() === '') continue
    add(key, typeof value === 'string' ? value.trim() : value)
  }

  return parts.length ? `?${parts.join('&')}` : ''
}

/**
 * @param {{
 *   page?: number,
 *   size?: number,
 *   sort?: { field: string, direction: 'asc' | 'desc' },
 *   status?: string,
 *   title?: string,
 * }} [options]
 */
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
