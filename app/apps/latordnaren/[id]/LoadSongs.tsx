import { neon } from "@neondatabase/serverless";

type Props = {
  id: string;
};

async function LoadSongs({ id }: Props) {
  const sql = neon(process.env.DATABASE_URL!);

  const songs = await sql`
    SELECT *
    FROM songs
    WHERE album_id = ${id};
  `;

  return (
    <ul>
      {songs.map((song: any) => (
        <li key={song.id}>{song.title}</li>
      ))}
    </ul>
  );
}

export default LoadSongs;
