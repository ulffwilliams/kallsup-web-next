import { neon } from "@neondatabase/serverless";
export const dynamic = "force-dynamic";

async function GigList() {
  const sql = neon(`${process.env.DATABASE_URL}`);
  const today = new Intl.DateTimeFormat("sv-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const gigs = (await sql`SELECT * FROM events ORDER BY date ASC;`).filter(
    (gig: any) => {
      const gigDate = new Intl.DateTimeFormat("sv-CA", {
        timeZone: "Europe/Stockholm",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(gig.date));
      return gigDate >= today;
    },
  );
  return (
    <section
      id="gigs"
      className=" flex items-center justify-center text-center"
    >
      <div id="gigs-container" className="flex flex-col gap-2">
        <h2 className="text-2xl">Kommande spelningar:</h2>
        <br />
        <ul className="flex flex-col gap-2 m-2">
          {gigs.length === 0 && (
            <li>
              Inga spelningar inbokade för tillfället.. Det kommer! Eller så
              kanske vi bara inte får prata om det än. Sistnämnda hade ju varit
              roligare.
            </li>
          )}
          {gigs.map((gig: any) => (
            <li
              key={gig.id}
              className="bg-kall-black pl-5 pr-5 flex justify-center items-center shadow-md"
            >
              {gig.date ? new Date(gig.date).toLocaleDateString("sv-SE") : ""}
              {" - "}
              {gig.venue}
              {", "}
              {gig.location}
              {gig.note && (
                <>
                  {" "}
                  {" - "}
                  {gig.note}
                </>
              )}
              {gig.ticketlink && (
                <>
                  {" -"}
                  &nbsp;
                  <a className="underline" href={gig.ticketlink}>
                    Länk
                  </a>
                </>
              )}
              <br />
              <br />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default GigList;
