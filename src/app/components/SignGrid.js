"use client";

import {useEffect, useState} from "react";
import SignView from "./SignView";
import {FiEyeOff, FiFileText, FiGrid, FiImage} from "react-icons/fi";
import views, {
  FULL_FULL_WIDTH,
  FULL_GRID,
  FULL_NO_IMAGE,
  FULL_NO_TEXT,
  FULL_YOUTUBE,
  HALF_YOUTUBE,
} from "@/app/components/views";
import {FaYoutube} from "react-icons/fa6";
import {LiaYoutubeSquare} from "react-icons/lia";

function SignGrid({showSigns}) {

  const [filter, setFilter] = useState(null);
  const [view, setView] = useState(localStorage.getItem('listView') || FULL_GRID);

  useEffect(() => {

    localStorage.setItem('listView', view);

  }, [view]);

  const cycleView = (direction = 1) => {
    setView((prevView) => views[(views.indexOf(prevView) + direction) % views.length]);
  }

  // Filter the listSigns based on the filter
  if (filter) {
    showSigns = showSigns.filter(sign => sign.name.toLowerCase().includes(filter.toLowerCase()));
  }

  // Order the listSigns based on the sign name
  showSigns = showSigns.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  return (
    <div>
      <div className="flex justify-between mb-4 gap-8">
        <input type="text"
               className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Filter"
               onChange={e => setFilter(e.target.value)}
        />
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={e => {
                  e.preventDefault();
                  cycleView(1);
                }}
                onContextMenu={e => {
                  e.preventDefault();
                  cycleView(-1);
                }}
        >
          {view === FULL_FULL_WIDTH && <FiImage/>}
          {view === FULL_GRID && <FiGrid/>}
          {view === FULL_NO_IMAGE && <FiEyeOff/>}
          {view === FULL_NO_TEXT && <FiFileText/>}
          {view === FULL_YOUTUBE && <FaYoutube/>}
          {view === HALF_YOUTUBE && <LiaYoutubeSquare/>}
        </button>
      </div>

      <div
        className={
          [FULL_GRID].indexOf(view) !== -1
            ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            :
            [HALF_YOUTUBE].indexOf(view) !== -1
              ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2"
              : "space-y-4"
        }
      >
        {showSigns.length > 30 && [FULL_YOUTUBE, HALF_YOUTUBE].indexOf(view) !== -1 ?
          <div className="text-gray-500">Too many signs to view Youtube's</div> : (
            showSigns.length ? (
              showSigns.map(sign => <SignView key={sign.id} sign={sign} view={view}/>)
            ) : (
              <div className="text-gray-500">No signs in this list.</div>
            )
          )
        }
      </div>
    </div>
  );

}

export default SignGrid;