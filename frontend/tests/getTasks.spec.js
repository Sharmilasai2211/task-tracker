import { test, expect } from '@playwright/test';

/**
 * Acceptance criteria focus: ensure getTasks() builds the correct request URL
 * (query params) and returns response data.
 *
 * We avoid any real network by replacing global.fetch with a stub that records
 * the requested URL.
 */

test.describe('frontend/src/api.js getTasks query params', () => {
  test('includes paging params when called with { page: 0, size: 10 }', async () => {
    const { getTasks } = await import('../src/api.js');

    let requestedUrl;
    global.fetch = async (url) => {
      requestedUrl = String(url);
      return {
        ok: true,
        status: 200,
        json: async () => [],
      };
    };

    const data = await getTasks({ page: 0, size: 10 });

    expect(data).toEqual([]);
    expect(requestedUrl).toContain('/tasks?');
    expect(requestedUrl).toContain('page=0');
    expect(requestedUrl).toContain('size=10');
  });

  test('includes sort param when called with { sort: { field: "title", direction: "asc" } }', async () => {
    const { getTasks } = await import('../src/api.js');

    let requestedUrl;
    global.fetch = async (url) => {
      requestedUrl = String(url);
      return {
        ok: true,
        status: 200,
        json: async () => [],
      };
    };

    await getTasks({ sort: { field: 'title', direction: 'asc' } });

    expect(requestedUrl).toContain('/tasks?');
    expect(requestedUrl).toContain('sort=title,asc');
  });

  test('includes filter params when called with { status: "DONE", title: "report" }', async () => {
    const { getTasks } = await import('../src/api.js');

    let requestedUrl;
    global.fetch = async (url) => {
      requestedUrl = String(url);
      return {
        ok: true,
        status: 200,
        json: async () => [],
      };
    };

    await getTasks({ status: 'DONE', title: 'report' });

    expect(requestedUrl).toContain('/tasks?');
    expect(requestedUrl).toContain('status=DONE');
    expect(requestedUrl).toContain('title=report');
  });

  test('no options -> calls /tasks with no query string and returns data', async () => {
    const { getTasks } = await import('../src/api.js');

    let requestedUrl;
    global.fetch = async (url) => {
      requestedUrl = String(url);
      return {
        ok: true,
        status: 200,
        json: async () => [{ id: 1 }],
      };
    };

    const data = await getTasks();

    expect(data).toEqual([{ id: 1 }]);
    expect(requestedUrl).toMatch(/\/tasks$/);
    expect(requestedUrl).not.toContain('?');
  });
});
