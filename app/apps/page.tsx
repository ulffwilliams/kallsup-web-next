import Logout from "../_components/logout";

import Applist from "./Applist";
export default function AppsPage() {


  return (
    <div id="dashboard-container" className="flex flex-col min-h-screen w-full">
      <nav className="w-full flex justify-end p-4 sticky top-0">
        <Logout />
      </nav>
      <main className=" flex flex-col justify-center items-center">
        <h1 className="">Kallsups verktygslåda</h1>
        <Applist />
      </main>
    </div>
  );
}
