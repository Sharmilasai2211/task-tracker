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

// Scalar = string/number/boolean; empty or whitespace-only strings and non-finite numbers are dropped.
function isUsableScalar(value) {
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'number') return Number.isFinite(value)
  return typeof value === 'boolean'
}

function buildTasksQuery(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) return ''

  const parts = []
  const add = (key, value) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)

  // Paging: page=0 is valid, so check for scalar-ness rather than truthiness.
  if (isUsableScalar(options.page)) add('page', options.page)
  if (isUsableScalar(options.size)) add('size', options.size)

  // Sorting: sort=field,direction. The comma is intentionally left unencoded.
  const { sort } = options
  if (sort && typeof sort === 'object' && !Array.isArray(sort)) {
    const direction = typeof sort.direction === 'string' ? sort.direction.trim().toLowerCase() : ''
    if (isUsableScalar(sort.field) && typeof sort.field === 'string' && (direction === 'asc' || direction === 'desc')) {
      parts.push(`sort=${encodeURIComponent(sort.field.trim())},${direction}`)
    }
  }

  // Filtering: status, title and any other scalar keys pass through; objects/arrays are ignored.
  for (const [key, value] of Object.entries(options)) {
    if (RESERVED_KEYS.has(key) || !isUsableScalar(value)) continue
    add(key, typeof value === 'string' ? value.trim() : value)
  }

  return parts.length ? `?${parts.join('&')}` : ''
}

/**
 * @param {{ page?: number, size?: number, sort?: { field: string, direction: 'asc'|'desc' },
 *           status?: string, title?: string, [key: string]: any }} [options]
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
