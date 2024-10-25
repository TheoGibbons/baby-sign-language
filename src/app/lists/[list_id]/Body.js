"use client";

import {useEffect, useState} from "react";
import SignView from "./SignView";
import LogoLink from "@/app/components/LogoLink";
import {BiEdit, BiSolidTrash} from "react-icons/bi";
import {useRouter} from "next/navigation";
import {FiEyeOff, FiFileText, FiGrid, FiImage} from "react-icons/fi";
import views, {
  FULL_FULL_WIDTH,
  FULL_GRID,
  FULL_NO_IMAGE,
  FULL_NO_TEXT,
  FULL_YOUTUBE,
  HALF_YOUTUBE,
} from "@/app/lists/[list_id]/views";
import {FaYoutube} from "react-icons/fa6";
import {LiaYoutubeSquare} from "react-icons/lia";

export default function Body({listId, signs}) {

  const [list, setList] = useState(null);
  const [filter, setFilter] = useState(null);
  const [view, setView] = useState(localStorage.getItem('listView') || FULL_GRID);
  const router = useRouter();

  useEffect(() => {

    fetch(`/api/lists/${listId}`, {
      method: 'GET'
    })
      .then(r => r.json())
      .then(r => {
        if (r.success) {
          setList(r.list);
        } else {
          alert('Failed to get list' + (r.errors ? "\n" + r.errors?.join("\n") : ''));
          router.push('/');
        }
      })
      .catch(() => alert("Website inaccessible. Failed to get list."))

  }, [listId]);

  useEffect(() => {

    localStorage.setItem('listView', view);

  }, [view]);

  const renameList = () => {

    // request new name for list
    const newName = prompt('Enter new name for list', list.name);

    fetch(`/api/lists/${encodeURIComponent(listId)}`, {
      method: 'PATCH',
      body: JSON.stringify({name: newName}),
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then(r => r.json())
      .then(r => {

        if (r.success) {
          setList(r.list);
        } else {
          alert('List rename failed');
        }

      })
      .catch(() => alert("Website inaccessible. Failed to rename list."))

  }

  const cycleView = () => {
    setView((prevView) => views[(views.indexOf(prevView) + 1) % views.length]);
  }

  const deleteList = () => {

    if (confirm(`Are you sure you want to delete your "${list.name}" list?`)) {

      // setLists((prevItems) => prevItems.filter(item => item.id !== list.id));

      fetch(`/api/lists/${list.id}`, {
        method: 'DELETE'
      })
        .then(r => r.json())
        .then(r => {
          if (!r.success) {
            // refreshLists(setLists)
            router.push('/');
            alert('Failed to delete list');
          }
        })
        .catch(() => alert("Website inaccessible. Failed to delete list."))
    }

  }

  // Convert the list.signs which is an array of id's to an array of sign objects
  let listSigns = list?.signs.map(signId => signs.find(sign => sign.id === signId));

  // Filter the listSigns based on the filter
  if (filter) {
    listSigns = listSigns.filter(sign => sign.name.toLowerCase().includes(filter.toLowerCase()));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {list ? (
        <div>
          <div className="flex justify-between items-center mb-4">

            <LogoLink/>

            <h1 className="text-2xl">
              List: <strong>{list.name}</strong>
            </h1>
            <div className="flex gap-2">
              <button
                onClick={renameList}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <BiEdit/>
              </button>
              <button
                onClick={deleteList}
                className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-600"
              >
                <BiSolidTrash/>
              </button>
            </div>

          </div>

          <div className="flex justify-between mb-4 gap-8">
            <input type="text"
                   className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Filter"
                   onChange={e => setFilter(e.target.value)}
            />
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={cycleView}
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
            {listSigns.length ? (
              listSigns.map(sign => <SignView key={sign.id} sign={sign} view={view}/>)
            ) : (
              <div className="text-gray-500">No signs in this list.</div>
            )}
          </div>

        </div>
      ) : (
        <p className="text-center text-gray-600">Loading...</p>
      )}
    </div>
  );

}
