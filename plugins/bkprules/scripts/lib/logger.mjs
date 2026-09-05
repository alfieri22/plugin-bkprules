function stamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function log(action, message) {
  process.stderr.write(`[${stamp()}] [${action}] ${message}\n`);
}
