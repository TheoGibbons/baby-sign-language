"use client";

import {useEffect, useState} from "react";
import SignView from "./SignView";
import LogoLink from "@/app/components/LogoLink";
import {BiEdit, BiSolidTrash} from "react-icons/bi";
import {useRouter} from "next/navigation";

export default function Body({listId, signs}) {

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

  }, [listId]);

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

          <ul className="space-y-4">
            {list.signs.length ? (
              list.signs.map((signId) => (
                <li key={signId} className="p-4 border rounded-lg bg-gray-50">
                  <SignView sign={signs.find((sign) => sign.id === signId)}/>
                </li>
              ))
            ) : (
              <li className="text-gray-500">No signs in this list.</li>
            )}
          </ul>
        </div>
      ) : (
        <p className="text-center text-gray-600">Loading...</p>
      )}
    </div>
  );


}
