import { neon } from "@neondatabase/serverless";

async function GigList() {
  const sql = neon(`${process.env.DATABASE_URL}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Jämför endast datum, inte tid
  const gigs = (await sql`SELECT * FROM events ORDER BY date ASC;`).filter(
    (gig: any) => {
      const gigDate = new Date(gig.date);
      gigDate.setHours(0, 0, 0, 0);
      return gigDate >= today;
    }
  );
  return (
    <section
      id="gigs"
      className=" flex items-center justify-center text-center"
    >
      <div id="gigs-container" className="flex flex-col gap-2 ml-8">
        <h2 className="">Kommande spelningar:</h2>
        <br />
        <ul>
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
