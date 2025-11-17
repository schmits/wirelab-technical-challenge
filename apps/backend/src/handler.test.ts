import { describe, it, expect } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";
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
        requestContext: {} as any
    };
}

describe("Lambda handler", () => {
    it("returns 200 for valid dashboard payload", async () => {
        const event = makeEvent({
            name: "Rian Schmits",
            email: "rian@example.com",
            message: "Een geldige message voor de handler test."
        });

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(result.headers?.["access-control-allow-origin"]).toBe("http://localhost:3000");

        const json = JSON.parse(result.body);
        expect(json.ok).toBe(true);
        expect(json.received.name).toBe("Rian Schmits");
    });

    it("returns 400 for invalid payload (too short name)", async () => {
        const event = makeEvent({
            name: "R",
            email: "rian@example.com",
            message: "Te korte naam, zou invalid moeten zijn."
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
            requestContext: {} as any
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(400);
        const json = JSON.parse(result.body);
        expect(json.ok).toBe(false);
    });
});
