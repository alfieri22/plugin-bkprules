import path from "node:path";

export function normalizePath(p) {
  return path.normalize(p).replace(/[\\/]+$/, "");
}

export function isUnder(child, root) {
  const c = normalizePath(child).toLowerCase();
  const r = normalizePath(root).toLowerCase();
  if (c === r) {
    return true;
  }
  return c.startsWith(r + path.sep);
}

export function relativeFromRoot(fullPath, root) {
  const rel = path.relative(normalizePath(root), normalizePath(fullPath));
  return rel === "" ? "" : rel;
}
