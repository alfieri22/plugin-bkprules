import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const META_FILE = ".bkprules-source";

export async function resolveProjectKey(workspaceFolderPath, backupRoot) {
  const baseName = path.basename(workspaceFolderPath);
  const bkprulesDir = path.join(backupRoot, ".bkprules");
  await fs.mkdir(bkprulesDir, { recursive: true });

  const simpleDest = path.join(bkprulesDir, baseName);
  const simpleMeta = path.join(simpleDest, META_FILE);

  try {
    const existing = (await fs.readFile(simpleMeta, "utf8")).trim();
    if (existing === workspaceFolderPath) {
      return baseName;
    }
    if (existing && existing !== workspaceFolderPath) {
      return withHashSuffix(baseName, workspaceFolderPath);
    }
  } catch {
    // no meta yet
  }

  try {
    await fs.access(simpleDest);
    const stat = await fs.stat(simpleDest);
    if (stat.isDirectory()) {
      try {
        const existing = (await fs.readFile(simpleMeta, "utf8")).trim();
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

export async function writeProjectMeta(destRoot, workspaceFolderPath) {
  await fs.mkdir(destRoot, { recursive: true });
  await fs.writeFile(path.join(destRoot, META_FILE), workspaceFolderPath, "utf8");
}

function withHashSuffix(baseName, absPath) {
  const hash = createHash("sha256").update(absPath.toLowerCase()).digest("hex").slice(0, 4);
  return `${baseName}-${hash}`;
}

export function getBackupDestRoot(backupRoot, projectKey) {
  return path.join(backupRoot, ".bkprules", projectKey);
}
