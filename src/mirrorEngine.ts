import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from './logger';
import { isUnder, relativeFromRoot } from './pathUtils';

const COPY_RETRIES = 8;
const COPY_RETRY_MS = 80;

export interface MirrorTarget {
  sourceCursorDir: string;
  destRoot: string;
  label: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function copyFileWithRetry(
  source: string,
  destination: string,
  logger: Logger
): Promise<boolean> {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  for (let i = 1; i <= COPY_RETRIES; i++) {
    try {
      await fs.copyFile(source, destination);
      return true;
    } catch (err) {
      if (i === COPY_RETRIES) {
        logger.log('ERROR', `Falha ao copiar ${source} -> ${destination}: ${String(err)}`);
        return false;
      }
      await sleep(COPY_RETRY_MS);
    }
  }
  return false;
}

async function walkDir(dir: string): Promise<string[]> {
  const results: string[] = [];
  async function walk(current: string): Promise<void> {
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

export async function syncMirror(
  target: MirrorTarget,
  logger: Logger
): Promise<void> {
  const { sourceCursorDir, destRoot } = target;

  try {
    await fs.access(sourceCursorDir);
  } catch {
    logger.log('SKIP', `Origem inexistente: ${sourceCursorDir}`);
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
      logger.log('SYNC-DIR', `${dst}`);
    } else {
      await copyFileWithRetry(src, dst, logger);
      logger.log('SYNC-FILE', `${src} -> ${dst}`);
    }
  }

  try {
    const destPaths = await walkDir(destRoot);
    destPaths.sort((a, b) => b.length - a.length);
    for (const dst of destPaths) {
      if (path.basename(dst) === '.bkprules-source') {
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
        logger.log('SYNC-DELETE', dst);
      }
    }
  } catch {
    // dest may be empty
  }
}

export async function mirrorFileCreatedOrChanged(
  target: MirrorTarget,
  filePath: string,
  logger: Logger,
  action: 'CREATED' | 'CHANGED'
): Promise<void> {
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
      logger.log(action, `DIR ${filePath} -> ${dst}`);
      return;
    }
    if (await copyFileWithRetry(filePath, dst, logger)) {
      logger.log(action, `${filePath} -> ${dst}`);
    }
  } catch {
    // file may have been deleted between event and handler
  }
}

export async function mirrorFileDeleted(
  target: MirrorTarget,
  filePath: string,
  logger: Logger
): Promise<void> {
  if (!isUnder(filePath, target.sourceCursorDir)) {
    return;
  }
  try {
    await fs.access(filePath);
    logger.log('SKIP', `Origem ainda existe, backup nao excluido: ${filePath}`);
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
    logger.log('DELETED', `${filePath} -> removeu ${dst}`);
  } catch {
    // already gone
  }
}
