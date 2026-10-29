import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { getTasks } from "./api";

describe("getTasks query params", () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn(async (_url) => {
      return {
        ok: true,
        json: async () => [{ id: 1, title: "T1" }],
      };
    });
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("includes paging query params when called with { page, size }", async () => {
    await getTasks({ page: 0, size: 10 });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = globalThis.fetch.mock.calls[0][0];
    expect(String(calledUrl)).toContain("?page=0&size=10");
  });

  it("includes sort query param when called with { sort: { field, direction } }", async () => {
    await getTasks({ sort: { field: "title", direction: "asc" } });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = globalThis.fetch.mock.calls[0][0];
    expect(String(calledUrl)).toContain("?sort=title,asc");
  });

  it("includes filter query params (status, title) when provided", async () => {
    await getTasks({ status: "DONE", title: "report" });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = String(globalThis.fetch.mock.calls[0][0]);
    const url = new URL(calledUrl);
    expect(url.searchParams.get("status")).toBe("DONE");
    expect(url.searchParams.get("title")).toBe("report");
  });

  it("with no options keeps URL without query string and returns data", async () => {
    const tasks = await getTasks();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = String(globalThis.fetch.mock.calls[0][0]);
    const url = new URL(calledUrl);
    expect(url.pathname).toBe("/api/tasks");
    expect(url.search).toBe("");
    expect(tasks).toEqual([{ id: 1, title: "T1" }]);
  });
});
