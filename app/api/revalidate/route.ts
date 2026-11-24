import { createHash, timingSafeEqual } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { GIGS_TAG } from "../../_lib/gigs";

/*
 * After editing `events` in the Neon console, open
 *   /api/revalidate?secret=<REVALIDATE_SECRET>
 * to make the change show up now instead of within the hour. GET so it works
 * as a phone bookmark. It only drops cache, so a leaked URL can at worst cost
 * a few extra database wakes. See docs/gig-cache.md.
 */
export const dynamic = "force-dynamic";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function GET(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return new Response("REVALIDATE_SECRET is not set.\n", { status: 503 });
  }

  const given = request.nextUrl.searchParams.get("secret") ?? "";
  if (!timingSafeEqual(digest(given), digest(expected))) {
    return new Response("Wrong secret.\n", { status: 401 });
  }

  /* { expire: 0 }: drop the entry now. The "max" profile would serve the old
     catalog to the next visitor while refreshing in the background. */
  revalidateTag(GIGS_TAG, { expire: 0 });
  revalidatePath("/");

  return new Response("Gigs refreshed.\n", {
    headers: { "Cache-Control": "no-store" },
  });
}
