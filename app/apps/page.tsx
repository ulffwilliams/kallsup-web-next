import Applist from "./Applist";
export default function AppsPage() {


  return (
    <div id="dashboard-container" className="flex flex-col min-h-screen w-full">
      <main className=" flex flex-col justify-center items-center">
        <h1 className="">Kallsups verktygslåda</h1>
        <Applist />
      </main>
    </div>
  );
}
