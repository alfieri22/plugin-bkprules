import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

const META_FILE = '.bkprules-source';

export async function resolveProjectKey(
  workspaceFolderPath: string,
  backupRoot: string
): Promise<string> {
  const baseName = path.basename(workspaceFolderPath);
  const bkprulesDir = path.join(backupRoot, '.bkprules');
  await fs.mkdir(bkprulesDir, { recursive: true });

  const simpleDest = path.join(bkprulesDir, baseName);
  const simpleMeta = path.join(simpleDest, META_FILE);

  try {
    const existing = (await fs.readFile(simpleMeta, 'utf8')).trim();
    if (existing === workspaceFolderPath) {
      return baseName;
    }
    if (existing && existing !== workspaceFolderPath) {
      return withHashSuffix(baseName, workspaceFolderPath);
    }
  } catch {
    // no meta yet — use simple name if folder free or belongs to us
  }

  try {
    await fs.access(simpleDest);
    const stat = await fs.stat(simpleDest);
    if (stat.isDirectory()) {
      try {
        const existing = (await fs.readFile(simpleMeta, 'utf8')).trim();
        if (existing === workspaceFolderPath) {
          return baseName;
        }
      } catch {
        return withHashSuffix(baseName, workspaceFolderPath);
      }
      return withHashSuffix(baseName, workspaceFolderPath);
    }
  } catch {
    // dest does not exist
  }

  return baseName;
}

export async function writeProjectMeta(
  destRoot: string,
  workspaceFolderPath: string
): Promise<void> {
  await fs.mkdir(destRoot, { recursive: true });
  await fs.writeFile(
    path.join(destRoot, META_FILE),
    workspaceFolderPath,
    'utf8'
  );
}

function withHashSuffix(baseName: string, absPath: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(absPath.toLowerCase())
    .digest('hex')
    .slice(0, 4);
  return `${baseName}-${hash}`;
}

export function getBackupDestRoot(
  backupRoot: string,
  projectKey: string
): string {
  return path.join(backupRoot, '.bkprules', projectKey);
}
