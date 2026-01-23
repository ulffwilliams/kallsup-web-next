import React from "react";
import Albumlist from "./Albumlist";

function Latordnaren() {
  return (
    <div className="w-full flex flex-col items-center justify-center mt-10 ">
      <h1 className="text-xl">Låtordnaren</h1>
      <Albumlist />
    </div>
  );
}

export default Latordnaren;
