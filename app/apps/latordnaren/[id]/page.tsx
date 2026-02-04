import LoadSongs from "./LoadSongs";

export default async function SlugPage({ params }: any) {
  const { id } = await params;

  return <LoadSongs id={id} />;
}
