"use client";

import {useEffect, useState} from "react";
import SignView from "./SignView";

export default function Body({listId, signs}) {

  const [list, setList] = useState(null);

  useEffect(() => {

    fetch(`/api/lists/${listId}`, {
      method: 'GET'
    })
      .then(r => r.json())
      .then(r => {
        if (r.success) {
          setList(r.list);
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

  return (
    <div>
      {list ?
        (
          <div>
            <h1>
              List: {list.name}
              <button onClick={renameList}>edit</button>
            </h1>
            <ul>
              {list.signs.length ?
                list.signs.map(signId => <SignView key={signId} sign={signs.find(sign => sign.id === signId)}/>) :
                <li>No signs in this list.</li>
              }
            </ul>
          </div>
        ) :
        <p>Loading...</p>
      }
    </div>
  );

}
