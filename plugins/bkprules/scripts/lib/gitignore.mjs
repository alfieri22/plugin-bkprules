import { promises as fs } from "node:fs";
import path from "node:path";
import { log } from "./logger.mjs";

const CURSOR_IGNORE_LINE = ".cursor/";

function hasCursorIgnoreRule(content) {
  return content
    .split(/\r?\n/)
    .some((line) => line.trim() === ".cursor" || line.trim() === ".cursor/");
}

export async function appendCursorToGitignore(workspaceFolderPath) {
  const gitignorePath = path.join(workspaceFolderPath, ".gitignore");

  try {
    let content = "";
    try {
      content = await fs.readFile(gitignorePath, "utf8");
    } catch {
      content = "";
    }

    if (hasCursorIgnoreRule(content)) {
      log("SKIP", `Gitignore ja contem .cursor/: ${gitignorePath}`);
      return false;
    }

    const suffix = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
    const block = `${suffix}\n# Cursor local rules (BKPrules)\n${CURSOR_IGNORE_LINE}`;
    await fs.writeFile(gitignorePath, content + block, "utf8");
    log("INFO", `Adicionado .cursor/ ao gitignore: ${gitignorePath}`);
    return true;
  } catch (err) {
    log("ERROR", `Falha ao atualizar gitignore: ${String(err)}`);
    return false;
  }
}
