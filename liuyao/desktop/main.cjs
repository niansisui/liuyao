const { app, BrowserWindow, Menu, protocol } = require("electron");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const webRoot = path.join(__dirname, "..", "web");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
};

protocol.registerSchemesAsPrivileged([{
  scheme: "app",
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}]);

async function serveApp(request) {
  const url = new URL(request.url);
  if (url.hostname !== "bundle") return new Response("Not found", { status: 404 });

  let relativePath;
  try {
    relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const filePath = path.resolve(webRoot, relativePath);
  const relative = path.relative(webRoot, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return new Response("Forbidden", { status: 403 });

  try {
    const body = await readFile(filePath);
    return new Response(body, {
      headers: {
        "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1180,
    height: 900,
    minWidth: 760,
    minHeight: 680,
    backgroundColor: "#f6f4ed",
    icon: path.join(__dirname, "..", "assets", "app.ico"),
    autoHideMenuBar: true,
    title: "六爻 · 纳甲排盘",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.loadURL("app://bundle/app.html");
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.liuyao.divination");
  Menu.setApplicationMenu(null);
  protocol.handle("app", serveApp);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
