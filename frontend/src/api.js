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

function isPresent(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  return true
}

function isScalar(value) {
  return ['string', 'number', 'boolean'].includes(typeof value)
}

function buildTasksQuery(options) {
  const { page, size, sort, ...rest } = options ?? {}
  const parts = []
  const add = (key, value) =>
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)

  if (isPresent(page)) add('page', page)
  if (isPresent(size)) add('size', size)

  if (sort && isPresent(sort.field) && isPresent(sort.direction)) {
    // Comma is intentionally left unencoded so the result reads `sort=title,asc`.
    parts.push(
      `sort=${encodeURIComponent(String(sort.field).trim())},${encodeURIComponent(String(sort.direction).trim())}`,
    )
  }

  for (const [key, value] of Object.entries(rest)) {
    if (RESERVED_QUERY_KEYS.has(key) || !isScalar(value) || !isPresent(value)) continue
    add(key, typeof value === 'string' ? value.trim() : value)
  }

  return parts.join('&')
}

export function getTasks(options) {
  const query = buildTasksQuery(options)
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
