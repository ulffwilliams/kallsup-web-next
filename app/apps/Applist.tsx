import fs from "fs";
import path from "path";
import Link from "next/link";

function Applist() {
  const appsDir = path.join(process.cwd(), "app", "apps");
  let directories: string[] = [];
  try {
    directories = fs
      .readdirSync(appsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((name) => name !== "_next" && name !== "api");
  } catch (e) {
    directories = [];
  }
  return (
    <>
      <div
        id="dash-content-container"
        className="bg-white w-full flex flex-wrap flex-row justify-center p-10 m-10 container gap-5"
      >
        {directories.map((directory) => (
          <Link href={`apps/${directory}`} key={directory}>
            <article className="dash-content-item bg-red-200 aspect-square  w-xs cq-sm:w-1/2 cq-lg:w-1/3 flex justify-center items-center ">
              {directory}
            </article>
          </Link>
        ))}
      </div>
    </>
  );
}

export default Applist;
