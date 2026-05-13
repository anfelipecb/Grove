import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {
  PUBLIC_DIR,
  closeTicket,
  createTicket,
  ensureBoardStructure,
  getBoardState,
  markTicketInReview,
  readConfig,
  startTicket,
  updateTicket
} from "./board-lib.mjs";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveStatic(response, fileName) {
  const targetPath = path.join(PUBLIC_DIR, fileName);
  const extension = path.extname(targetPath);
  const source = await fs.readFile(targetPath);
  response.writeHead(200, { "Content-Type": MIME_TYPES[extension] || "text/plain; charset=utf-8" });
  response.end(source);
}

function ticketIdFromPath(pathname, suffix = "") {
  if (!pathname.startsWith("/api/tickets/")) {
    return "";
  }

  const remainder = pathname.slice("/api/tickets/".length);

  if (suffix && remainder.endsWith(suffix)) {
    return decodeURIComponent(remainder.slice(0, -suffix.length));
  }

  if (!suffix && !remainder.includes("/")) {
    return decodeURIComponent(remainder);
  }

  return "";
}

function createRequestHandler() {
  return async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");

    try {
      if (request.method === "GET" && url.pathname === "/api/state") {
        sendJson(response, 200, await getBoardState());
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/tickets") {
        const body = await readBody(request);
        const ticket = await createTicket(body.title || "", {
          priority: body.priority || "p2",
          status: body.status || "backlog"
        });
        sendJson(response, 201, { ticket });
        return;
      }

      if (request.method === "PATCH") {
        const ticketId = ticketIdFromPath(url.pathname);

        if (ticketId) {
          const body = await readBody(request);
          const ticket = await updateTicket(ticketId, body);
          sendJson(response, 200, { ticket });
          return;
        }
      }

      if (request.method === "POST") {
        const ticketId = ticketIdFromPath(url.pathname, "/start");

        if (ticketId) {
          const body = await readBody(request);
          const result = await startTicket(ticketId, body.owner || "");
          sendJson(response, 200, result);
          return;
        }
      }

      if (request.method === "POST") {
        const ticketId = ticketIdFromPath(url.pathname, "/review");

        if (ticketId) {
          const body = await readBody(request);
          sendJson(response, 200, await markTicketInReview(ticketId, body.pr_url || "", body.owner || ""));
          return;
        }
      }

      if (request.method === "POST") {
        const ticketId = ticketIdFromPath(url.pathname, "/close");

        if (ticketId) {
          sendJson(response, 200, await closeTicket(ticketId));
          return;
        }
      }

      if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        await serveStatic(response, "index.html");
        return;
      }

      if (request.method === "GET" && (url.pathname === "/app.js" || url.pathname === "/styles.css")) {
        await serveStatic(response, url.pathname.slice(1));
        return;
      }

      if (request.method === "GET" && url.pathname === "/favicon.ico") {
        response.writeHead(204);
        response.end();
        return;
      }

      sendJson(response, 404, { error: "Not found." });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
  };
}

async function listen(server, startingPort) {
  for (let port = startingPort; port < startingPort + 10; port += 1) {
    try {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", resolve);
      });
      return port;
    } catch (error) {
      server.removeAllListeners("error");

      if (error.code !== "EADDRINUSE") {
        throw error;
      }
    }
  }

  throw new Error(`Could not bind a board port between ${startingPort} and ${startingPort + 9}.`);
}

await ensureBoardStructure();
const config = await readConfig();
const server = createServer(createRequestHandler());
const port = await listen(server, config.port || 4317);

console.log(`Board server running at http://127.0.0.1:${port}`);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
