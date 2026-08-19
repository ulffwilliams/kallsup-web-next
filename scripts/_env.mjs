import { readFileSync } from "node:fs";

/**
 * Minimal .env.local reader. Next loads this file itself, but these scripts run
 * as bare node, outside the framework.
 *
 * Existing process env wins, so `FOO=bar node scripts/...` overrides the file.
 */
export function loadEnvLocal(path = ".env.local") {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return;
  }

  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
  }
}
