-- Backfill past Kallsup gigs from setlist.fm (fetched 2026-11-24).
-- Idempotent: skips any row whose (date, venue) already exists in events.
-- Run in the Neon SQL editor on the branch production reads (tour-preview).
BEGIN;

INSERT INTO events (date, location, venue, note)
SELECT v.date::date, v.location, v.venue, v.note
FROM (VALUES
  ('2022-11-26', 'Örebro',              'Kvarteret',           NULL::text),
  ('2023-10-28', 'Örebro',              'Kvarteret',           NULL),
  ('2024-03-22', 'Norrköping',          'Kafé Tassen',         'Future Echoes'),
  ('2024-03-23', 'Norrköping',          'Rumpan Bar',          'Future Echoes'),
  ('2024-04-27', 'Uppsala',             'Ungdomens Hus',       NULL),
  ('2024-06-07', 'Stockholm',           'Kollektivet Livet',   NULL),
  ('2024-06-29', 'Uppsala',             'Kulturhuset Femman',  NULL),
  ('2024-09-12', 'Örebro',              'Satin',               'Live at Heart'),
  ('2024-09-13', 'Örebro',              'Coco Thai',           'Live at Heart'),
  ('2024-09-13', 'Örebro',              'Makeriet',            'Live at Heart'),
  ('2024-10-12', 'Linköping',           'Palatset',            NULL),
  ('2024-12-28', 'Örebro',              'Svampen',             NULL),
  ('2025-02-01', 'Hägersten',           'Landet',              NULL),
  ('2025-03-29', 'Örebro',              'Satin',               NULL),
  ('2025-04-11', 'Malmö',               'Grand',               NULL),
  ('2025-04-12', 'Aarhus, Denmark',     'Headquarters',        NULL),
  ('2025-04-13', 'Sønderborg, Denmark', 'Sønderborghus',       NULL),
  ('2025-04-16', 'Hamburg, Germany',    'MS Hedi',             NULL),
  ('2025-04-19', 'Copenhagen, Denmark', 'Loppen',              NULL),
  ('2025-04-26', 'Uppsala',             'Kalmar Nation',       NULL),
  ('2025-05-10', 'Kristinehamn',        'Mastmagasinet',       NULL),
  ('2025-05-31', 'Sandviken',           'Kungen',              NULL),
  ('2025-06-06', 'Eskilstuna',          'K100',                NULL),
  ('2025-06-07', 'Göteborg',            'Folkteatern',         NULL),
  ('2025-09-05', 'Stockholm',           'Debaser Nova',        NULL),
  ('2025-09-06', 'Örebro',              'Kulturhuset',         'Live at Heart'),
  ('2025-10-03', 'Göteborg',            'Pustervik',           NULL),
  ('2025-10-17', 'Karlskrona',          'Kulturhuset Oden',    NULL),
  ('2025-10-31', 'Malmö',               'Grand',               NULL),
  ('2025-11-01', 'Lund',                'Blekingska Nationen', NULL),
  ('2025-12-19', 'Stockholm',           'Slaktkyrkan',         NULL),
  ('2026-04-25', 'Stockholm',           'Debaser Nova',        NULL)
) AS v(date, location, venue, note)
WHERE NOT EXISTS (
  SELECT 1 FROM events e
  WHERE e.date = v.date::date AND e.venue = v.venue
);

-- INSERT reports 32 rows the first time, 0 on a re-run.
-- Past gigs total afterwards: 41 (32 new + 9 already in the table).
SELECT count(*) AS past_gigs FROM events
WHERE date < (now() AT TIME ZONE 'Europe/Stockholm')::date;

COMMIT;
