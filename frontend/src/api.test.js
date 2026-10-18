import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { getTasks } from './api.js'

describe('gY_Tasks - query parameter building', () => {
  const BASE_URL = 'http://localhost:8050/api/tasks'

  let fetchSpy

  beforeEach(() => {
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      })
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('appends page/size when called with { page: 0, size: 10 }', async () => {
    await getTasks({ page: 0, size: 10 })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}?page=0&size=10`)
  })

  it('appends sort when called with { sort: { field: "title", direction: "asc" } }', async () => {
    await getTasks({ sort: { field: 'title', direction: 'asc' } })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}?sort=title,asc`)
  })

  it('appends filters when called with { status: "DONE", title: "report" }', async () => {
    await getTasks({ status: 'DONE', title: 'report' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE_URL}?status=DONE&title=report`)
  })

  it('keeps the URL without a query string when called with no options', async () => {
    await getTasks()
    expect(fetchSpy.mock.calls[0][0]).toBe(BASE_URL)
  })
})
