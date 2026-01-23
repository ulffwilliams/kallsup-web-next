import LoadSongs from "../LoadSongs";

interface SlugPageProps {
  params: Promise<{ id: string }>;
}

const SlugPage = async ({ params }: SlugPageProps) => {
  const { id } = await params;
  return (
    <>
      <p>ID: {id}</p>;
      <LoadSongs />
    </>
  );
};

export default SlugPage;
