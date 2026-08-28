import Link from "next/link";

import { formatGigDate } from "../../_lib/gigs";
import { getTicketClickStats } from "../../_lib/ticketClicks";
import { unlocked } from "./auth";
import PasswordGate from "./PasswordGate";

export const metadata = { title: "Biljettstatistik" };

/* Counts change with every click; a cached page would show stale numbers. */
export const dynamic = "force-dynamic";

/** "2026-08-28T19:04:11.000Z" -> "28 aug 21:04" in Stockholm time. */
function formatLastClick(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  }).format(new Date(iso));
}

function Row({
  gig,
}: {
  gig: Awaited<ReturnType<typeof getTicketClickStats>>[number];
}) {
  const date = formatGigDate(gig.date);

  return (
    <tr className="border-b border-kall-800">
      <td className="py-3 pr-4 whitespace-nowrap">
        <span className="type-label">
          {date.day} {date.month} {date.year}
        </span>
      </td>
      <td className="py-3 pr-4 text-sm text-kall-cream">{gig.location}</td>
      <td className="py-3 pr-4 text-sm text-kall-cream">
        {gig.venue}
        {!gig.hasLink && (
          <span className="type-label ml-2">ingen biljettlänk</span>
        )}
      </td>
      <td className="py-3 pr-4 text-right font-display text-2xl leading-none font-bold text-kall-cream tabular-nums">
        {gig.clicks}
      </td>
      <td className="py-3 pr-4 text-right text-sm text-kall-300 tabular-nums">
        {gig.clicks7d}
      </td>
      <td className="py-3 text-right">
        <span className="type-label">
          {gig.lastClick ? formatLastClick(gig.lastClick) : "—"}
        </span>
      </td>
    </tr>
  );
}

function Table({
  title,
  gigs,
  empty,
}: {
  title: string;
  gigs: Awaited<ReturnType<typeof getTicketClickStats>>;
  empty: string;
}) {
  return (
    <section className="mt-12">
      <h2 className="type-label mb-4">{title}</h2>

      {gigs.length === 0 ? (
        <p className="type-meta">{empty}</p>
      ) : (
        /* Narrow screens scroll the table rather than the page. */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-kall-600">
                <th className="type-label py-2 pr-4 font-normal">Datum</th>
                <th className="type-label py-2 pr-4 font-normal">Ort</th>
                <th className="type-label py-2 pr-4 font-normal">Lokal</th>
                <th className="type-label py-2 pr-4 text-right font-normal">
                  Klick
                </th>
                <th className="type-label py-2 pr-4 text-right font-normal">
                  7 dgr
                </th>
                <th className="type-label py-2 text-right font-normal">
                  Senaste
                </th>
              </tr>
            </thead>
            <tbody>
              {gigs.map((gig) => (
                <Row key={gig.id} gig={gig} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * Clicks on the "Biljetter" buttons, per gig. The numbers come from our own
 * redirect at /go/biljett/<id>, so ad blockers cannot suppress them — but they
 * count intent to buy, not sales; the vendor is the only one who knows those.
 */
export default async function BiljettstatistikPage() {
  if (!(await unlocked())) {
    return <PasswordGate />;
  }

  const gigs = await getTicketClickStats();
  const upcoming = gigs.filter((gig) => gig.upcoming);
  const past = gigs.filter((gig) => !gig.upcoming);
  const total = gigs.reduce((sum, gig) => sum + gig.clicks, 0);
  const total7d = gigs.reduce((sum, gig) => sum + gig.clicks7d, 0);

  return (
    <main className="shell py-12">
      <Link href="/apps" className="type-label">
        ← Verktygslådan
      </Link>

      <h1 className="font-display mt-6 text-4xl font-bold tracking-tight text-kall-cream italic">
        Biljettstatistik
      </h1>

      <p className="type-meta mt-3 max-w-xl">
        Antal klick på Biljetter-knappen. Räknas på servern, så adblock stör
        inte — men det är klick, inte sålda biljetter.
      </p>

      <div className="mt-8 flex gap-10">
        <div>
          <span className="font-display block text-4xl leading-none font-bold text-kall-cream tabular-nums">
            {total}
          </span>
          <span className="type-label">totalt</span>
        </div>
        <div>
          <span className="font-display block text-4xl leading-none font-bold text-kall-cream tabular-nums">
            {total7d}
          </span>
          <span className="type-label">senaste 7 dgr</span>
        </div>
      </div>

      <Table
        title="Kommande"
        gigs={upcoming}
        empty="Inga kommande spelningar."
      />
      <Table title="Tidigare" gigs={past} empty="Inga tidigare spelningar." />
    </main>
  );
}
