#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { appendCursorToGitignore } from "./lib/gitignore.mjs";
import { log } from "./lib/logger.mjs";

async function readStdinJson() {
  if (process.stdin.isTTY) {
    return {};
  }

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function uniquePaths(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (typeof value !== "string" || value.trim().length === 0) {
      continue;
    }
    const normalized = path.resolve(value.trim());
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

async function main() {
  const payload = await readStdinJson();
  const fromPayload = Array.isArray(payload.workspace_roots) ? payload.workspace_roots : [];
  const extra = process.argv.slice(2);
  const roots = uniquePaths([
    ...fromPayload,
    process.env.CURSOR_PROJECT_DIR,
    process.env.CURSOR_PROJECT_ROOT,
    ...extra,
    process.cwd(),
  ]);

  let count = 0;
  for (const workspacePath of roots) {
    const ok = await appendCursorToGitignore(workspacePath);
    if (ok) {
      count += 1;
    }
  }

  log("INFO", `.cursor/ adicionado em ${count} projeto(s)`);
}

main().catch((error) => {
  log("ERROR", String(error?.stack ?? error));
  process.exit(1);
});
