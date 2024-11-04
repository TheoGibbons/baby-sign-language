"use client";

import SignGrid from "@/app/components/SignGrid";
import LogoLink from "@/app/components/LogoLink";

function Body({signs}) {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">

        <LogoLink/>

        <h1 className="text-2xl">
          All Signs
        </h1>

      </div>

      <SignGrid showSigns={signs}/>
    </div>
  );
}

export default Body;