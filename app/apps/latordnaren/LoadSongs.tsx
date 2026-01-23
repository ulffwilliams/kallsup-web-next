import { neon } from "@neondatabase/serverless";

async function LoadSongs() {

  const sql = neon(`${process.env.DATABASE_URL}`);

  const songs = await sql`SELECT * FROM albums ORDER BY id ASC;`;

  return (
    <div>loadSongs</div>
  )
}

export default LoadSongs;