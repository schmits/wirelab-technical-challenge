import http from "http";
import { ContactSchema } from "@wirelab/shared";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

function getAllowedOrigin(req: http.IncomingMessage): string {
  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  return ALLOWED_ORIGINS[0];
}

function setCorsHeaders(req: http.IncomingMessage, res: http.ServerResponse) {
    res.setHeader("access-control-allow-origin", getAllowedOrigin(req));
    res.setHeader("access-control-allow-methods", "POST, OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type");
}

export function createAppServer() {
    return http.createServer((req, res) => {
        const method = req.method ?? "GET";
        const url = req.url ?? "/";

        if (method === "OPTIONS") {
            setCorsHeaders(req, res);
            res.writeHead(204);
            return res.end();
        }

      if (method === "GET" && url === "/dashboard") {
        setCorsHeaders(req, res);
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(
          JSON.stringify({
            totalSubmissions: 42,
            lastExample: {
              name: "Rian Schmits",
              email: "rian@example.com",
              messagePreview: "Voorbeeldbericht vanuit de lokale mock."
            },
            updatedAt: new Date().toISOString()
          })
        );
      }

      if (method !== "POST" || url !== "/") {
            setCorsHeaders(req, res);
            res.writeHead(404, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "Not found" }));
        }

        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", () => {
            try {
                const json = body ? JSON.parse(body) : {};
                const parsed = ContactSchema.parse(json);

                console.debug("Local mock received dashboard message", {
                    name: parsed.name,
                    email: parsed.email,
                    message: parsed.message,
                    timestamp: new Date().toISOString()
                });

                setCorsHeaders(req, res);
                res.writeHead(200, { "content-type": "application/json" });
                res.end(
                    JSON.stringify({
                        ok: true,
                        received: { name: parsed.name }
                    })
                );
            } catch (err: any) {
                console.error("Local mock validation or parsing failed", {
                    error: err?.message,
                    timestamp: new Date().toISOString()
                });

                setCorsHeaders(req, res);
                res.writeHead(400, { "content-type": "application/json" });
                res.end(
                    JSON.stringify({
                        ok: false,
                        error: err?.message ?? "Invalid input"
                    })
                );
            }
        });
    });
}

if (require.main === module) {
    const server = createAppServer();
    server.listen(PORT, () => {
        console.log(
            `Local mock contact server listening on http://localhost:${PORT}/)`
        );
    });
}
