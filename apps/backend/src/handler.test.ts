import { describe, it, expect } from "vitest";
import type { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from "aws-lambda";
import { handler } from "./handler";

function makeEvent(body: unknown): APIGatewayProxyEvent {
  return {
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: "POST",
    isBase64Encoded: false,
    path: "/",
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: "/",
    requestContext: {} as any,
  };
}

function makeFunctionUrlEvent(
  method: string,
  rawPath: string,
  body?: unknown,
  headers: Record<string, string> = {}
): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath,
    rawQueryString: "",
    headers,
    requestContext: {
      accountId: "anonymous",
      apiId: "local",
      domainName: "example.lambda-url.eu-west-1.on.aws",
      domainPrefix: "example",
      http: {
        method,
        path: rawPath,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest",
      },
      requestId: "test-request",
      routeKey: "$default",
      stage: "$default",
      time: "01/Jan/2026:00:00:00 +0000",
      timeEpoch: 1767225600000,
    },
    isBase64Encoded: false,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

describe("Lambda handler", () => {
  it("returns 200 for valid contact payload", async () => {
    const event = makeEvent({
      name: "Rian Schmits",
      email: "rian@example.com",
      message: "Een geldige message voor de handler test.",
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers?.["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(result.headers?.["access-control-allow-methods"]).toContain("GET");

    const json = JSON.parse(result.body);
    expect(json.ok).toBe(true);
    expect(json.received.name).toBe("Rian Schmits");
  });

  it("returns 400 for invalid payload (too short name)", async () => {
    const event = makeEvent({
      name: "R",
      email: "rian@example.com",
      message: "Te korte naam, zou invalid moeten zijn.",
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(result.headers?.["access-control-allow-origin"]).toBe("http://localhost:3000");

    const json = JSON.parse(result.body);
    expect(json.ok).toBe(false);
    expect(json.error).toBeDefined();
  });

  it("returns 400 for malformed JSON body", async () => {
    const event: APIGatewayProxyEvent = {
      body: "{ this is not valid json",
      headers: {},
      multiValueHeaders: {},
      httpMethod: "POST",
      isBase64Encoded: false,
      path: "/",
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      resource: "/",
      requestContext: {} as any,
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const json = JSON.parse(result.body);
    expect(json.ok).toBe(false);
  });

  it("routes Lambda Function URL GET /dashboard events", async () => {
    const event = makeFunctionUrlEvent("GET", "/dashboard", undefined, {
      origin: "http://localhost:3001",
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers?.["access-control-allow-origin"]).toBe("http://localhost:3001");

    const json = JSON.parse(result.body);
    expect(json.totalSubmissions).toBe(42);
    expect(json.lastExample.email).toBe("rian@example.com");
  });

  it("handles CORS preflight requests", async () => {
    const event = makeFunctionUrlEvent("OPTIONS", "/dashboard", undefined, {
      origin: "http://localhost:3001",
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(204);
    expect(result.body).toBe("");
    expect(result.headers?.["access-control-allow-origin"]).toBe("http://localhost:3001");
    expect(result.headers?.["access-control-allow-methods"]).toContain("GET");
    expect(result.headers?.["access-control-allow-methods"]).toContain("POST");
  });
});