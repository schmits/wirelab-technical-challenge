import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { Server } from "http";
import { createAppServer } from "./local-server";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createAppServer();

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      if (typeof addr === "object" && addr && "port" in addr) {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      } else {
        throw new Error("Could not determine server port");
      }
      resolve();
    });
  });
});

afterAll(() => {
  server.close();
});

describe("local-server (mock backend)", () => {
  it("handles CORS preflight (OPTIONS /)", async () => {
    const res = await fetch(baseUrl, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000"
    );
    expect(res.headers.get("access-control-allow-methods")).toContain("GET");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });

  it("returns 200 and JSON for valid POST /", async () => {
    const res = await fetch(baseUrl + "/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Rian Schmits",
        email: "rian@example.com",
        message: "Een geldige testboodschap.",
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000"
    );

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.received.name).toBe("Rian Schmits");
  });

  it("returns 200 and JSON for GET /dashboard", async () => {
    const res = await fetch(baseUrl + "/dashboard", {
      method: "GET",
      headers: {
        Origin: "http://localhost:3001",
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3001"
    );

    const json = await res.json();
    expect(json.totalSubmissions).toBe(42);
    expect(json.lastExample.email).toBe("rian@example.com");
  });

  it("returns 400 for invalid payload", async () => {
    const res = await fetch(baseUrl + "/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "R",
        email: "rian@example.com",
        message: "Nog steeds te korte naam.",
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBeDefined();
  });

  it("returns 404 for wrong path", async () => {
    const res = await fetch(baseUrl + "/does-not-exist", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Rian",
        email: "rian@example.com",
        message: "Test",
      }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Not found");
  });
});