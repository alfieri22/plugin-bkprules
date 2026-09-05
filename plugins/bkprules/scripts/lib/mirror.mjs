import { promises as fs } from "node:fs";
import path from "node:path";
import { log } from "./logger.mjs";
import { isUnder, relativeFromRoot } from "./pathUtils.mjs";

const COPY_RETRIES = 8;
const COPY_RETRY_MS = 80;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function copyFileWithRetry(source, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  for (let i = 1; i <= COPY_RETRIES; i++) {
    try {
      await fs.copyFile(source, destination);
      return true;
    } catch (err) {
      if (i === COPY_RETRIES) {
        log("ERROR", `Falha ao copiar ${source} -> ${destination}: ${String(err)}`);
        return false;
      }
      await sleep(COPY_RETRY_MS);
    }
  }
  return false;
}

async function walkDir(dir) {
  const results = [];

  async function walk(current) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        results.push(full);
        await walk(full);
      } else {
        results.push(full);
      }
    }
  }

  await walk(dir);
  return results;
}

export async function syncMirror(target) {
  const { sourceCursorDir, destRoot } = target;

  try {
    await fs.access(sourceCursorDir);
  } catch {
    log("SKIP", `Origem inexistente: ${sourceCursorDir}`);
    return;
  }

  await fs.mkdir(destRoot, { recursive: true });

  const sourcePaths = await walkDir(sourceCursorDir);
  for (const src of sourcePaths) {
    const rel = relativeFromRoot(src, sourceCursorDir);
    if (!rel) {
      continue;
    }
    const dst = path.join(destRoot, rel);
    const stat = await fs.stat(src);
    if (stat.isDirectory()) {
      await fs.mkdir(dst, { recursive: true });
      log("SYNC-DIR", dst);
    } else {
      await copyFileWithRetry(src, dst);
      log("SYNC-FILE", `${src} -> ${dst}`);
    }
  }

  try {
    const destPaths = await walkDir(destRoot);
    destPaths.sort((a, b) => b.length - a.length);
    for (const dst of destPaths) {
      if (path.basename(dst) === ".bkprules-source") {
        continue;
      }
      const rel = relativeFromRoot(dst, destRoot);
      if (!rel) {
        continue;
      }
      const src = path.join(sourceCursorDir, rel);
      try {
        await fs.access(src);
      } catch {
        await fs.rm(dst, { recursive: true, force: true });
        log("SYNC-DELETE", dst);
      }
    }
  } catch {
    // dest may be empty
  }
}

export async function mirrorFileCreatedOrChanged(target, filePath, action) {
  if (!isUnder(filePath, target.sourceCursorDir)) {
    return;
  }
  try {
    const stat = await fs.stat(filePath);
    const rel = relativeFromRoot(filePath, target.sourceCursorDir);
    if (!rel) {
      return;
    }
    const dst = path.join(target.destRoot, rel);
    if (stat.isDirectory()) {
      await fs.mkdir(dst, { recursive: true });
      log(action, `DIR ${filePath} -> ${dst}`);
      return;
    }
    if (await copyFileWithRetry(filePath, dst)) {
      log(action, `${filePath} -> ${dst}`);
    }
  } catch {
    // file may have been deleted between event and handler
  }
}

export async function mirrorFileDeleted(target, filePath) {
  if (!isUnder(filePath, target.sourceCursorDir)) {
    return;
  }
  try {
    await fs.access(filePath);
    log("SKIP", `Origem ainda existe, backup nao excluido: ${filePath}`);
    return;
  } catch {
    // expected
  }

  const rel = relativeFromRoot(filePath, target.sourceCursorDir);
  if (!rel) {
    return;
  }
  const dst = path.join(target.destRoot, rel);
  try {
    await fs.rm(dst, { recursive: true, force: true });
    log("DELETED", `${filePath} -> removeu ${dst}`);
  } catch {
    // already gone
  }
}
