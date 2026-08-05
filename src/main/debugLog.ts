import { app, ipcMain, WebContents } from "electron";
import fs from "fs";
import path from "path";
import util from "util";

// Off by default. Enabled from the UI switch when something goes wrong and the logs are needed.
const logDir = path.join(app.getPath("home"), ".shunpo");
const logFile = path.join(logDir, "shunpo.log");
const flagFile = path.join(logDir, "debug-logging-enabled");

let enabled = fs.existsSync(flagFile);

// Account records pass through console output - never let a credential reach a file the user hands out.
const REDACT_PASSWORDS = /("?password"?\s*[:=]\s*)("[^"]*"|'[^']*'|\S+)/gi;

function append(source: "main" | "renderer", level: string, args: any[]) {
  if (!enabled) return;
  try {
    const line = args
      .map((arg) => (typeof arg === "string" ? arg : util.inspect(arg, { depth: 4 })))
      .join(" ")
      .replace(REDACT_PASSWORDS, '$1"***"');
    // ponytail: sync append per line, fine at this app's log volume - use a write stream if it ever gets chatty
    fs.appendFileSync(logFile, `${new Date().toISOString()} [${source}/${level}] ${line}\n`);
  } catch {
    // logging must never break the app
  }
}

for (const level of ["log", "info", "warn", "error", "debug"] as const) {
  const original = console[level];
  console[level] = (...args: any[]) => {
    append("main", level, args);
    original.apply(console, args);
  };
}

// Renderer output is captured from the main process rather than by patching console in the
// renderer: this still works when the renderer never runs our code at all - a bundle that fails
// to parse, a preload that threw, an uncaught exception during startup. Those are the white-page
// cases, and they are exactly the ones a renderer-side patch would miss.
export function attachRendererLogging(contents: WebContents) {
  contents.on("console-message", ({ level, message, sourceId, lineNumber }) =>
    append("renderer", level, [`${message} (${sourceId}:${lineNumber})`])
  );
  contents.on("preload-error", (_e, preloadPath, error) =>
    append("renderer", "preload-error", [preloadPath, error])
  );
  contents.on("render-process-gone", (_e, details) =>
    append("renderer", "process-gone", [details])
  );
  contents.on("did-fail-load", (_e, code, description, url) =>
    append("renderer", "did-fail-load", [`${code} ${description} ${url}`])
  );
}

ipcMain.handle("debugLogging:get", () => ({ enabled, logFile }));

ipcMain.handle("debugLogging:set", (_, value: boolean) => {
  if (!value) console.log("Debug logging disabled");
  enabled = value;
  if (value) {
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(flagFile, "");
    console.log(`Debug logging enabled -> ${logFile}`);
  } else {
    fs.rmSync(flagFile, { force: true });
  }
  return enabled;
});
