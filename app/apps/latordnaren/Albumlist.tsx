import Link from "next/link";
import { neon } from "@neondatabase/serverless";

async function Albumlist() {
  const sql = neon(`${process.env.DATABASE_URL}`);

  const albums = await sql`SELECT * FROM albums ORDER BY id ASC;`;

  return (
    <>
      <div
        id="dash-content-container"
        className="w-full flex flex-wrap flex-row justify-center p-10 m-10 container gap-5"
      >
        {albums.map((album) => (
          <Link
            href={{
              pathname: `/apps/latordnaren/${album.id}`,
              query: { id: album.id },
            }}
            key={album.id}
          >
            <article
              className="dash-content-item aspect-square bg-red-200 w-xs cq-sm:w-1/2 cq-lg:w-1/3 flex justify-center items-center bg-center bg-cover"
              style={{
                backgroundImage: album.album_art_url
                  ? `url('${album.album_art_url}')`
                  : undefined,
              }}
            >
              {!album.album_art_url && album.album_name}
            </article>
          </Link>
        ))}
      </div>
    </>
  );
}

export default Albumlist;
