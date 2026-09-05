import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from './logger';

const CURSOR_IGNORE_LINE = '.cursor/';

export async function appendCursorToGitignore(
  workspaceFolderPath: string,
  logger: Logger
): Promise<boolean> {
  const gitignorePath = path.join(workspaceFolderPath, '.gitignore');

  try {
    let content = '';
    try {
      content = await fs.readFile(gitignorePath, 'utf8');
    } catch {
      content = '';
    }

    if (hasCursorIgnoreRule(content)) {
      logger.log('SKIP', `Gitignore ja contem .cursor/: ${gitignorePath}`);
      return false;
    }

    const suffix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
    const block = `${suffix}\n# Cursor local rules (BKPrules)\n${CURSOR_IGNORE_LINE}`;
    await fs.writeFile(gitignorePath, content + block, 'utf8');
    logger.log('INFO', `Adicionado .cursor/ ao gitignore: ${gitignorePath}`);
    return true;
  } catch (err) {
    logger.log('ERROR', `Falha ao atualizar gitignore: ${String(err)}`);
    return false;
  }
}

function hasCursorIgnoreRule(content: string): boolean {
  return content
    .split(/\r?\n/)
    .some((line) => line.trim() === '.cursor' || line.trim() === '.cursor/');
}
