import * as path from 'path';

export function normalizePath(p: string): string {
  return path.normalize(p).replace(/[\/]+$/, '');
}

export function isUnder(child: string, root: string): boolean {
  const c = normalizePath(child).toLowerCase();
  const r = normalizePath(root).toLowerCase();
  if (c === r) {
    return true;
  }
  return c.startsWith(r + path.sep);
}

export function relativeFromRoot(fullPath: string, root: string): string {
  const rel = path.relative(normalizePath(root), normalizePath(fullPath));
  return rel === '' ? '' : rel;
}

export function joinPath(...parts: string[]): string {
  return path.join(...parts);
}
