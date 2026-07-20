import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import { ContactSchema } from "@wirelab/shared";

const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

type SupportedEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;

type RequestInfo = {
  method: string;
  path: string;
};

function isFunctionUrlEvent(event: SupportedEvent): event is APIGatewayProxyEventV2 {
  return "rawPath" in event && "requestContext" in event && "http" in event.requestContext;
}

function getHeader(event: SupportedEvent, name: string): string | undefined {
  const lowerName = name.toLowerCase();
  const header = Object.entries(event.headers ?? {}).find(
    ([key]) => key.toLowerCase() === lowerName
  )?.[1];

  return Array.isArray(header) ? header[0] : header;
}

function getAllowedOrigin(event: SupportedEvent): string {
  const origin = getHeader(event, "origin");

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  return ALLOWED_ORIGINS[0];
}

function getRequestInfo(event: SupportedEvent): RequestInfo {
  if (isFunctionUrlEvent(event)) {
    return {
      method: event.requestContext.http.method,
      path: event.rawPath ?? "/",
    };
  }

  return {
    method: event.httpMethod ?? "GET",
    path: event.path ?? "/",
  };
}

function corsHeaders(event: SupportedEvent): Record<string, string> {
  return {
    "access-control-allow-origin": getAllowedOrigin(event),
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function jsonResponse(
  event: SupportedEvent,
  statusCode: number,
  body: unknown
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      ...corsHeaders(event),
    },
    body: JSON.stringify(body),
  };
}

function emptyResponse(event: SupportedEvent, statusCode: number): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders(event),
    body: "",
  };
}

export const handler = async (
  event: SupportedEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { method, path } = getRequestInfo(event);

    if (method === "OPTIONS") {
      return emptyResponse(event, 204);
    }

    if (method === "GET" && path === "/dashboard") {
      const meta = {
        totalSubmissions: 42,
        lastExample: {
          name: "Rian Schmits",
          email: "rian@example.com",
          messagePreview: "Dit is een voorbeeldbericht dat vanuit de meta-endpoint komt.",
        },
        updatedAt: new Date().toISOString(),
      };

      return jsonResponse(event, 200, meta);
    }

    if (method !== "POST" || path !== "/") {
      return jsonResponse(event, 404, {
        ok: false,
        error: "Not found",
      });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse(event, 400, {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    const { name, message } = parsed.data;

    console.debug("Lambda received contact message", {
      name,
      messageLength: message.length,
      timestamp: new Date().toISOString(),
    });

    return jsonResponse(event, 200, {
      ok: true,
      received: { name },
    });
  } catch (err: any) {
    console.error("Validation or parsing failed", {
      error: err?.message,
      timestamp: new Date().toISOString(),
    });

    return jsonResponse(event, 400, {
      ok: false,
      error: err?.message ?? "Invalid input",
    });
  }
};