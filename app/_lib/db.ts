import { neon } from "@neondatabase/serverless";

/*
 * Preview deploys read a Neon *branch* so unannounced shows never reach the
 * live site. The wiring is entirely in Vercel: a second DATABASE_URL scoped to
 * one Preview git branch, which takes precedence over the unscoped value for
 * builds of that branch. Nothing to special-case here.
 */
export function db() {
  const url = process.env.DATABASE_URL;

  /*
   * Interpolating straight into neon() turns a missing var into the string
   * "undefined", and the driver then reports an invalid URL with the value
   * redacted — which says nothing about which env var is at fault or how. The
   * checks below name the variable and the actual problem instead.
   */
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. On Vercel, check that the variable covers the " +
        "environment being built (and the git branch, if it is branch-scoped).",
    );
  }

  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error(
      "DATABASE_URL is not a postgres:// URL. A likely cause is pasting " +
        "Neon's full `psql '...'` command instead of just the connection " +
        "string — the value must start with postgresql:// and carry no quotes.",
    );
  }

  return neon(url);
}
