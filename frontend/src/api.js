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

function buildTasksQueryString(options) {
  if (!options || typeof options !== 'object') {
    return ''
  }

  const params = []
  const appendParam = (key, value) => {
    params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value))
  }
  const appendIfPresent = (key, value) => {
    if (value === null || value === undefined) return
    appendParam(key, value)
  }
  const appendFilterParam = (key, value) => {
    if (value === null || value === undefined) return
    if (typeof value === 'string' && value.trim() === '') return
    appendParam(key, value)
  }

  appendIfPresent('page', options.page)
  appendIfPresent('size', options.size)

  if (options.sort && typeof options.sort === 'object') {
    const fieldStr = options.sort.field == null ? '' : String(options.sort.field).trim()
    const directionStr = options.sort.direction == null ? '' : String(options.sort.direction).trim()
    if (fieldStr && directionStr) {
      // comma kept literal (not percent-encoded) so sort value matches "field,direction" exactly
      params.push('sort=' + encodeURIComponent(fieldStr) + ',' + encodeURIComponent(directionStr))
    }
  }

  appendFilterParam('status', options.status)
  appendFilterParam('title', options.title)

  return params.length > 0 ? ('?' + params.join('&')) : ''
}

export function getTasks(options) {
  const queryString = buildTasksQueryString(options)
  return fetch(`${BASE_URL}/tasks${queryString}`).then(handleResponse)
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
