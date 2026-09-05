import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const LOCAL_CONFIG = path.join(os.homedir(), ".bkprules", "config.json");

function isUnset(value) {
  if (value == null) {
    return true;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return true;
  }
  return trimmed.startsWith("${") && trimmed.endsWith("}");
}

function parseBool(value, fallback = false) {
  if (isUnset(value)) {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

async function readLocalConfig() {
  try {
    const raw = await fs.readFile(LOCAL_CONFIG, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

export async function resolveConfig(cliRoot) {
  const local = await readLocalConfig();
  const backupRoot = [cliRoot, process.env.BACKUP_ROOT, local.backupRoot]
    .map((value) => (isUnset(value) ? "" : String(value).trim()))
    .find((value) => value.length > 0);

  const addToGitignore = parseBool(
    process.env.ADD_TO_GITIGNORE,
    Boolean(local.addToGitignore)
  );

  return {
    backupRoot: backupRoot ?? "",
    addToGitignore,
    localConfigPath: LOCAL_CONFIG,
  };
}
