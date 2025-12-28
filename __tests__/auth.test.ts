import { strict as assert } from "node:assert";
import test, { describe } from "node:test";
import { ID_TOKEN_REFRESH_MS, REFRESH_TOKEN_REFRESH_MS } from "../src/constants";
import { VisualpingClient } from "../src/index";

type FetchCall = { url: string; init?: RequestInit };

function headersOf(init?: RequestInit): Headers {
  return new Headers(init?.headers);
}

const originalFetch = globalThis.fetch;

function json(res: unknown) {
  return new Response(JSON.stringify(res), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("VisualpingClient authentication", () => {
  test("empty state => PASSWORD flow, sets tokens + timestamps", async () => {
    const calls: FetchCall[] = [];

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return json({
        id_token: "id_from_password",
        refresh_token: "refresh_from_password",
      });
    }) as typeof fetch;

    try {
      const client = new VisualpingClient("e", "p");
      const before = Date.now();
      await client["ensureAuthenticated"]();
      const after = Date.now();

      assert.equal(calls.length, 1);
      const vpCall = calls[0];
      assert.ok(vpCall.init?.body);

      const body = JSON.parse(String(vpCall.init.body)) as {
        method: string;
        email: string;
        password: string;
      };

      assert.equal(vpCall.url, "https://api.visualping.io/v2/token");
      assert.equal(body.method, "PASSWORD");
      assert.equal(body.email, "e");
      assert.equal(body.password, "p");

      assert.equal(client["idToken"], "id_from_password");
      assert.equal(client["refreshToken"], "refresh_from_password");

      assert.ok(client["lastIdTokenRefresh"] instanceof Date);
      assert.ok(client["lastRefreshTokenRefresh"] instanceof Date);

      const idTokenRefresh = client["lastIdTokenRefresh"].getTime();
      const refreshTokenRefresh =
        client["lastRefreshTokenRefresh"].getTime();

      assert.ok(idTokenRefresh >= before && idTokenRefresh <= after);
      assert.ok(
        refreshTokenRefresh >= before && refreshTokenRefresh <= after
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("refresh token expired (>29 days) => PASSWORD flow again", async () => {
    const calls: FetchCall[] = [];

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return json({
        id_token: "id_from_password",
        refresh_token: "refresh_from_password",
      });
    }) as typeof fetch;

    try {
      const client = new VisualpingClient("e", "p");

      client["refreshToken"] = "stale_rt";
      client["lastRefreshTokenRefresh"] = new Date(
        Date.now() - REFRESH_TOKEN_REFRESH_MS - 1
      );
      client["idToken"] = "stale_id";
      client["lastIdTokenRefresh"] = new Date(0);

      await client["ensureAuthenticated"]();

      assert.equal(calls.length, 1);
      const body = JSON.parse(String(calls[0].init?.body)) as {
        method: string;
      };

      assert.equal(body.method, "PASSWORD");
      assert.equal(client["idToken"], "id_from_password");
      assert.equal(client["refreshToken"], "refresh_from_password");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("refresh token valid + id token expired => REFRESH_TOKEN flow", async () => {
    const calls: FetchCall[] = [];

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return json({ id_token: "id_from_refresh" });
    }) as typeof fetch;

    try {
      const client = new VisualpingClient("e", "p");

      const validLastRefreshTime = new Date();

      client["refreshToken"] = "rt";
      client["lastRefreshTokenRefresh"] = validLastRefreshTime;
      client["idToken"] = "id";
      client["lastIdTokenRefresh"] = new Date(
        Date.now() - ID_TOKEN_REFRESH_MS - 1
      );

      await client["ensureAuthenticated"]();

      const body = JSON.parse(String(calls[0].init?.body)) as {
        method: string;
        refreshToken: string;
      };

      assert.equal(body.method, "REFRESH_TOKEN");
      assert.equal(body.refreshToken, "rt");
      assert.equal(client["idToken"], "id_from_refresh");
      assert.equal(client["lastRefreshTokenRefresh"], validLastRefreshTime);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("refresh token valid + id token valid => no auth call", async () => {
    const calls: FetchCall[] = [];

    globalThis.fetch = (async (url: string) => {
      calls.push({ url });
      return new Response("ok");
    }) as typeof fetch;

    try {
      const client = new VisualpingClient("e", "p");

      const rtTime = new Date();
      const idTime = new Date();

      client["refreshToken"] = "rt";
      client["lastRefreshTokenRefresh"] = rtTime;
      client["idToken"] = "id";
      client["lastIdTokenRefresh"] = idTime;

      await client["ensureAuthenticated"]();

      assert.equal(calls.length, 0);
      assert.equal(client["lastIdTokenRefresh"], idTime);
      assert.equal(client["lastRefreshTokenRefresh"], rtTime);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("authenticated requests include Authorization header", async () => {
    const calls: FetchCall[] = [];

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return json({ ok: true });
    }) as typeof fetch;

    try {
      const client = new VisualpingClient("e", "p");

      client["refreshToken"] = "rt";
      client["lastRefreshTokenRefresh"] = new Date();
      client["idToken"] = "id_seeded";
      client["lastIdTokenRefresh"] = new Date();

      await client.describeUser();

      const headers = headersOf(calls[0].init);
      assert.equal(headers.get("Authorization"), "Bearer id_seeded");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("/token requests do not include Authorization header", async () => {
    const calls: FetchCall[] = [];

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return json({ id_token: "id", refresh_token: "rt" });
    }) as typeof fetch;

    try {
      const client = new VisualpingClient("e", "p");
      await client["ensureAuthenticated"]();

      const headers = headersOf(calls[0].init);
      assert.equal(headers.get("Authorization"), null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
