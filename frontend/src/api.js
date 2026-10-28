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

const RESERVED_QUERY_KEYS = new Set(['page', 'size', 'sort'])

function isScalar(value) {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  )
}

function buildTasksQuery(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    return ''
  }

  const parts = []
  const add = (key, value) => {
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }

  const { page, size, sort, ...filters } = options

  if (isScalar(page)) add('page', page)
  if (isScalar(size)) add('size', size)

  if (sort && typeof sort === 'object' && !Array.isArray(sort)) {
    const field = typeof sort.field === 'string' ? sort.field.trim() : ''
    const direction = typeof sort.direction === 'string' ? sort.direction.trim() : ''
    if (field) {
      // Comma is intentionally left unencoded: sort=<field>,<direction>
      const encodedField = encodeURIComponent(field)
      parts.push(
        direction
          ? `sort=${encodedField},${encodeURIComponent(direction)}`
          : `sort=${encodedField}`,
      )
    }
  }

  for (const [key, value] of Object.entries(filters)) {
    if (RESERVED_QUERY_KEYS.has(key) || !isScalar(value)) continue
    if (typeof value === 'string' && value.trim() === '') continue
    add(key, typeof value === 'string' ? value.trim() : value)
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
