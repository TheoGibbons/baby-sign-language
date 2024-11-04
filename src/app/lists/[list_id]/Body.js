"use client";

import {useEffect, useState} from "react";
import LogoLink from "@/app/components/LogoLink";
import {BiEdit, BiSolidTrash} from "react-icons/bi";
import {useRouter} from "next/navigation";
import SignGrid from "@/app/components/SignGrid";

function Body({listId, signs}) {

  const [list, setList] = useState(null);
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

  }, [listId, router]);

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
  let showSigns = list?.signs.map(signId => signs.find(sign => sign.id === signId));

  return (
    <div className="p-6 max-w-6xl mx-auto">
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

          <SignGrid showSigns={showSigns}/>

        </div>
      ) : (
        <p className="text-center text-gray-600">Loading...</p>
      )}
    </div>
  );

}

export default Body;