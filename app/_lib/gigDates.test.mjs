/*
 * Run with `npm test`. Plain .mjs on purpose: tsconfig only includes .ts/.tsx/
 * .mts, so `next build` never type-checks this file's `./gigDates.ts` import
 * (which tsc would reject without allowImportingTsExtensions).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { isTicketLinkLive, stockholmToday, toUpcomingGigs } from "./gigDates.ts";

function entry(overrides = {}) {
  return {
    id: 1,
    date: "2026-12-01",
    location: "Örebro",
    venue: "Frimis",
    note: null,
    ticketlink: "https://tickets.example/1",
    publishdate: null,
    ticketreleasedate: null,
    soldout: false,
    ...overrides,
  };
}

test("stockholmToday: summer (UTC+2), 22:30 UTC is already the next day", () => {
  assert.equal(stockholmToday(new Date("2026-07-24T22:30:00Z")), "2026-07-25");
});

test("stockholmToday: summer (UTC+2), 21:59 UTC is still the same day", () => {
  assert.equal(stockholmToday(new Date("2026-07-24T21:59:00Z")), "2026-07-24");
});

test("stockholmToday: winter (UTC+1), 23:00 UTC is already the next day", () => {
  assert.equal(stockholmToday(new Date("2026-01-14T23:00:00Z")), "2026-01-15");
});

test("stockholmToday: winter (UTC+1), 22:59 UTC is still the same day", () => {
  assert.equal(stockholmToday(new Date("2026-01-14T22:59:00Z")), "2026-01-14");
});

test("toUpcomingGigs: drops past gigs, keeps a gig dated today", () => {
  const result = toUpcomingGigs(
    [entry({ id: 1, date: "2026-11-23" }), entry({ id: 2, date: "2026-11-24" })],
    "2026-11-24",
  );
  assert.deepEqual(result.map((g) => g.id), [2]);
});

test("toUpcomingGigs: hides a gig until its publishdate, shows it on that day", () => {
  const catalog = [entry({ publishdate: "2026-11-25" })];
  assert.equal(toUpcomingGigs(catalog, "2026-11-24").length, 0);
  assert.equal(toUpcomingGigs(catalog, "2026-11-25").length, 1);
});

test("toUpcomingGigs: ticketsreleased flips on the release day", () => {
  const catalog = [entry({ ticketreleasedate: "2026-11-25" })];
  assert.equal(toUpcomingGigs(catalog, "2026-11-24")[0].ticketsreleased, false);
  assert.equal(toUpcomingGigs(catalog, "2026-11-25")[0].ticketsreleased, true);
});

test("toUpcomingGigs: no release date means released", () => {
  assert.equal(toUpcomingGigs([entry()], "2026-11-24")[0].ticketsreleased, true);
});

test("toUpcomingGigs: sorts by date, then id", () => {
  const result = toUpcomingGigs(
    [
      entry({ id: 3, date: "2026-12-05" }),
      entry({ id: 2, date: "2026-12-01" }),
      entry({ id: 1, date: "2026-12-01" }),
    ],
    "2026-11-24",
  );
  assert.deepEqual(result.map((g) => g.id), [1, 2, 3]);
});

test("toUpcomingGigs: returns the Gig shape without publishdate", () => {
  const [gig] = toUpcomingGigs(
    [entry({ note: "Släpp", ticketreleasedate: "2026-11-01", soldout: true })],
    "2026-11-24",
  );
  assert.deepEqual(gig, {
    id: 1,
    date: "2026-12-01",
    location: "Örebro",
    venue: "Frimis",
    note: "Släpp",
    ticketlink: "https://tickets.example/1",
    ticketreleasedate: "2026-11-01",
    ticketsreleased: true,
    soldout: true,
  });
});

test("isTicketLinkLive: false without a link", () => {
  assert.equal(isTicketLinkLive(entry({ ticketlink: null }), "2026-11-24"), false);
});

test("isTicketLinkLive: false before publishdate, true on it", () => {
  const e = entry({ publishdate: "2026-11-25" });
  assert.equal(isTicketLinkLive(e, "2026-11-24"), false);
  assert.equal(isTicketLinkLive(e, "2026-11-25"), true);
});

test("isTicketLinkLive: false before ticketreleasedate, true on it", () => {
  const e = entry({ ticketreleasedate: "2026-11-25" });
  assert.equal(isTicketLinkLive(e, "2026-11-24"), false);
  assert.equal(isTicketLinkLive(e, "2026-11-25"), true);
});
