import type { APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";
import { ContactSchema } from "@wirelab/shared";

const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

function getAllowedOrigin(req: http.IncomingMessage): string {
  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  return ALLOWED_ORIGINS[0];
}

function jsonResponse(
  event: APIGatewayProxyEvent,
  statusCode: number,
  body: unknown
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": getAllowedOrigin(event)
    },
    body: JSON.stringify(body)
  };
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {

    const method = event.httpMethod ?? "GET";
    const path = event.path ?? "/";

    if (method === "GET" && path === "/dashboard") {

      const meta = {
        totalSubmissions: 42,
        lastExample: {
          name: "Rian Schmits",
          email: "rian@example.com",
          messagePreview: "Dit is een voorbeeldbericht dat vanuit de meta-endpoint komt."
        },
        updatedAt: new Date().toISOString()
      };

      return jsonResponse(event, 200, meta);
    }

    if (method !== "POST") {
      return jsonResponse(event, 405, {
        ok: false,
        error: "Method not allowed"
      });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse(event, 400, {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input"
      });
    }

    const { name, message } = parsed.data;

    console.debug("Lambda received dashboard message", {
      name,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    return jsonResponse(event, 200, {
      ok: true,
      received: { name }
    });
  } catch (err: any) {
    console.error("Validation or parsing failed", {
      error: err?.message,
      timestamp: new Date().toISOString()
    });

    return jsonResponse(event, 400, {
      ok: false,
      error: err?.message ?? "Invalid input"
    });
  }
};
