import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/* Shared password, not per-user accounts: the page only shows click counts,
   and the band wants to open it on a phone without a login flow. Override in
   the environment to change it without a deploy. */
const PASSWORD = process.env.BILJETTSTATISTIK_PASSWORD ?? "Kallsup6767";

export const COOKIE = "biljettstatistik";

/* The cookie stores a hash of the password rather than the password itself,
   so reading the cookie jar does not hand over the password. */
function token() {
  return createHash("sha256").update(PASSWORD).digest("hex");
}

export function isCorrect(input: string) {
  const a = Buffer.from(createHash("sha256").update(input).digest("hex"));
  const b = Buffer.from(token());
  return timingSafeEqual(a, b);
}

export async function unlocked() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === token();
}

export async function grant() {
  const jar = await cookies();
  jar.set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/apps/biljettstatistik",
    maxAge: 60 * 60 * 24 * 30,
  });
}
