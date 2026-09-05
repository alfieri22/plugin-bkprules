#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { resolveConfig } from "./lib/config.mjs";
import { appendCursorToGitignore } from "./lib/gitignore.mjs";
import { log } from "./lib/logger.mjs";
import {
  mirrorFileCreatedOrChanged,
  mirrorFileDeleted,
  syncMirror,
} from "./lib/mirror.mjs";
import { isUnder } from "./lib/pathUtils.mjs";
import { getBackupDestRoot, resolveProjectKey, writeProjectMeta } from "./lib/projectKey.mjs";

function parseArgs(argv) {
  let mode = "full";
  let root = "";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--incremental") {
      mode = "incremental";
    } else if (arg === "--full") {
      mode = "full";
    } else if (arg === "--root" && argv[i + 1]) {
      root = argv[++i];
    }
  }

  return { mode, root };
}

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

function inferWorkspaceFromFile(filePath) {
  let current = path.dirname(filePath);
  while (true) {
    if (path.basename(current) === ".cursor") {
      return path.dirname(current);
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function resolveWorkspaceRoots(payload) {
  const fromPayload = Array.isArray(payload.workspace_roots) ? payload.workspace_roots : [];
  const fromEnv = [process.env.CURSOR_PROJECT_DIR, process.env.CURSOR_PROJECT_ROOT];
  const roots = uniquePaths([...fromPayload, ...fromEnv]);

  if (roots.length > 0) {
    return roots;
  }

  if (typeof payload.file_path === "string") {
    const inferred = inferWorkspaceFromFile(path.resolve(payload.file_path));
    if (inferred) {
      return [inferred];
    }
  }

  return [process.cwd()];
}

async function resolveTarget(workspacePath, backupRoot) {
  const sourceCursorDir = path.join(workspacePath, ".cursor");
  const projectKey = await resolveProjectKey(workspacePath, backupRoot);
  const destRoot = getBackupDestRoot(backupRoot, projectKey);
  await writeProjectMeta(destRoot, workspacePath);
  return {
    sourceCursorDir,
    destRoot,
    label: projectKey,
    workspacePath,
  };
}

async function syncWorkspace(workspacePath, config) {
  try {
    await fs.access(path.join(workspacePath, ".cursor"));
  } catch {
    log("SKIP", `Sem pasta .cursor: ${workspacePath}`);
    return;
  }

  const target = await resolveTarget(workspacePath, config.backupRoot);
  log("INIT", `Sincronizando ${target.label} (${target.sourceCursorDir})`);
  await syncMirror(target);

  if (config.addToGitignore) {
    await appendCursorToGitignore(workspacePath);
  }
}

async function incrementalSync(payload, config) {
  const filePath = typeof payload.file_path === "string" ? path.resolve(payload.file_path) : "";
  if (!filePath) {
    log("SKIP", "Hook incremental sem file_path");
    return;
  }

  const roots = resolveWorkspaceRoots(payload);
  const workspacePath =
    roots.find((root) => isUnder(filePath, path.join(root, ".cursor"))) ??
    inferWorkspaceFromFile(filePath);

  if (!workspacePath) {
    log("SKIP", `Arquivo fora de .cursor: ${filePath}`);
    return;
  }

  if (!isUnder(filePath, path.join(workspacePath, ".cursor"))) {
    log("SKIP", `Arquivo fora de .cursor: ${filePath}`);
    return;
  }

  const target = await resolveTarget(workspacePath, config.backupRoot);

  try {
    await fs.access(filePath);
    await mirrorFileCreatedOrChanged(target, filePath, "CHANGED");
  } catch {
    await mirrorFileDeleted(target, filePath);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = await readStdinJson();
  const config = await resolveConfig(args.root);

  if (!config.backupRoot) {
    log(
      "SKIP",
      "BACKUP_ROOT nao configurado. Defina em Customize → Plugins → BKPrules ou em ~/.bkprules/config.json"
    );
    return;
  }

  if (args.mode === "incremental") {
    await incrementalSync(payload, config);
    return;
  }

  const roots = resolveWorkspaceRoots(payload);
  for (const workspacePath of roots) {
    await syncWorkspace(workspacePath, config);
  }
}

main().catch((error) => {
  log("ERROR", String(error?.stack ?? error));
  process.exit(1);
});
