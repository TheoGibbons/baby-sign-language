"use client";

import SignGrid from "@/app/components/SignGrid";
import LogoLink from "@/app/components/LogoLink";
import ProfileMenu from "@/app/components/ProfileMenu";

function Body({signs}) {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">

        <LogoLink/>

        <div className="flex items-center gap-2">
          <h1 className="text-2xl">
            All Signs
          </h1>
          <ProfileMenu/>
        </div>

      </div>

      <SignGrid showSigns={signs}/>
    </div>
  );
}

export default Body;