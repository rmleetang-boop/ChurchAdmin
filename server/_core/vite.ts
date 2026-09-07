import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(path.join(distPath, "index.html"))) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath, {
    setHeaders(res, filePath) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      const relative = path.relative(distPath, filePath).split(path.sep).join("/");
      res.setHeader("Cache-Control", /^assets\/[^/]+-[\w-]{8,}\.[\w]+$/.test(relative)
        ? "public, max-age=31536000, immutable"
        : "no-store");
    },
  }));

  app.use("*", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const requestPath = req.originalUrl.split("?")[0];
    // SPA fallback is only for page navigation, never a deleted asset or API.
    if ((req.method !== "GET" && req.method !== "HEAD") ||
        requestPath === "/api" || requestPath.startsWith("/api/") || requestPath.startsWith("/assets/") ||
        path.extname(requestPath) || !req.accepts("html")) {
      res.status(404).type("text").send("Not found");
      return;
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
