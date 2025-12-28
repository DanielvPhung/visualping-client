import { strict as assert } from "node:assert";
import test, { afterEach, beforeEach, describe } from "node:test";
import { VisualpingApiError } from "../src/error";
import { VisualpingClient } from "../src/index";

type FetchCall = { url: string; init?: RequestInit };

const originalFetch = globalThis.fetch;

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function headersOf(init?: RequestInit): Headers {
  return new Headers(init?.headers);
}

function seedValidAuth(client: any) {
  client["refreshToken"] = "rt";
  client["lastRefreshTokenRefresh"] = new Date();
  client["idToken"] = "id_seeded";
  client["lastIdTokenRefresh"] = new Date();
}

describe("VisualpingClient.authenticatedRequest", () => {
  let calls: FetchCall[] = [];

  beforeEach(() => {
    calls = [];
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("adds Authorization: Bearer <idToken> and merges headers", async () => {
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return json({ ok: true });
    }) as typeof fetch;

    const client: any = new VisualpingClient("e", "p");
    seedValidAuth(client);

    const res = await client["authenticatedRequest"]("https://x.test/endpoint", {
      method: "POST",
      headers: { "X-Test": "123" },
      body: JSON.stringify({ a: 1 }),
    });

    assert.deepEqual(res, { ok: true });
    assert.equal(calls.length, 1);

    const h = headersOf(calls[0].init);
    assert.equal(h.get("Authorization"), "Bearer id_seeded");
    assert.equal(h.get("Content-Type"), "application/json");
    assert.equal(h.get("X-Test"), "123");
  });

  test("retries on 429 then succeeds", async () => {
    let n = 0;

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      n += 1;

      if (n === 1) return json({ message: "rate limited" }, 429);
      return json({ ok: true }, 200);
    }) as typeof fetch;

    const client: any = new VisualpingClient("e", "p");
    seedValidAuth(client);

    const res = await client["authenticatedRequest"]("https://x.test/endpoint");
    assert.deepEqual(res, { ok: true });
    assert.equal(calls.length, 2);
  });

  test("retries on 5xx then succeeds", async () => {
    let n = 0;

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      n += 1;

      if (n === 1) return json({ message: "server error" }, 500);
      return json({ ok: true }, 200);
    }) as typeof fetch;

    const client: any = new VisualpingClient("e", "p");
    seedValidAuth(client);

    const res = await client["authenticatedRequest"]("https://x.test/endpoint");
    assert.deepEqual(res, { ok: true });
    assert.equal(calls.length, 2);
  });

  test("retries on network error then succeeds", async () => {
    let n = 0;

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      n += 1;

      if (n === 1) throw new Error("ECONNRESET");
      return json({ ok: true }, 200);
    }) as typeof fetch;

    const client: any = new VisualpingClient("e", "p");
    seedValidAuth(client);

    const res = await client["authenticatedRequest"]("https://x.test/endpoint");
    assert.deepEqual(res, { ok: true });
    assert.equal(calls.length, 2);
  });

  test("does NOT retry on 403 (fails immediately)", async () => {
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return json({ message: "forbidden" }, 403);
    }) as typeof fetch;

    const client: any = new VisualpingClient("e", "p");
    seedValidAuth(client);

    await assert.rejects(
      () => client["authenticatedRequest"]("https://x.test/endpoint"),
      (err: unknown) => {
        assert.ok(err instanceof VisualpingApiError);
        assert.equal((err as VisualpingApiError).status, 403);
        return true;
      }
    );

    assert.equal(calls.length, 1);
  });

  test("stops after retries (default 2) on repeated 5xx", async () => {
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return json({ message: "server error" }, 500);
    }) as typeof fetch;

    const client: any = new VisualpingClient("e", "p");
    seedValidAuth(client);

    await assert.rejects(
      () => client["authenticatedRequest"]("https://x.test/endpoint"),
      (err: unknown) => {
        assert.ok(err instanceof VisualpingApiError);
        assert.equal((err as VisualpingApiError).status, 500);
        return true;
      }
    );

    // initial try + 2 retries = 3 total calls
    assert.equal(calls.length, 3);
  });
});
