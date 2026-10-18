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

function isUsableScalar(value) {
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'number') return Number.isFinite(value)
  return typeof value === 'boolean'
}

function buildSortParam(sort) {
  if (typeof sort === 'string') {
    return sort.trim() === ''
      ? null
      : sort.split(',').map((part) => encodeURIComponent(part.trim())).join(',')
  }
  if (sort && typeof sort === 'object' && isUsableScalar(sort.field)) {
    const field = encodeURIComponent(String(sort.field).trim())
    return isUsableScalar(sort.direction)
      ? `${field},${encodeURIComponent(String(sort.direction).trim())}`
      : field
  }
  return null
}

function buildTasksQuery(options) {
  if (!options || typeof options !== 'object') return ''

  const parts = []
  const add = (key, value) => parts.push(`${encodeURIComponent(key)}=${value}`)

  for (const key of ['page', 'size']) {
    if (isUsableScalar(options[key])) add(key, encodeURIComponent(options[key]))
  }

  const sort = buildSortParam(options.sort)
  if (sort) add('sort', sort)

  for (const [key, value] of Object.entries(options)) {
    if (key === 'page' || key === 'size' || key === 'sort') continue
    if (isUsableScalar(value)) add(key, encodeURIComponent(value))
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
