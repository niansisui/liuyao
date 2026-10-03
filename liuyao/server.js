import { createReadStream, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "web");
const PROJECT_ROOT = path.dirname(ROOT);
const packageInfo = JSON.parse(readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8"));
const installerName = `${packageInfo.build.productName}-安装程序-${packageInfo.version}-x64.exe`;
const installerPath = path.join(PROJECT_ROOT, "release", installerName);
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
};
const server = createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  if (pathname === "/download/windows") {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end("仅支持下载请求");
      return;
    }

    try {
      const fileSize = statSync(installerPath).size;
      response.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileSize,
        "Content-Disposition": `attachment; filename="Liuyao-Setup-${packageInfo.version}-x64.exe"; filename*=UTF-8''${encodeURIComponent(installerName)}`,
        "X-Content-Type-Options": "nosniff",
      });
      if (request.method === "HEAD") {
        response.end();
      } else {
        createReadStream(installerPath).pipe(response);
      }
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Windows 安装包尚未生成，请先运行 npm.cmd run package。");
    }
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    if (!statSync(filePath).isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": filePath.endsWith("service-worker.js") ? "no-cache" : "public, max-age=3600",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

const port = Number(process.env.PORT) || 4173;
server.listen(port, "127.0.0.1", () => {
  console.log(`六爻网页已启动：http://127.0.0.1:${port}`);
});
