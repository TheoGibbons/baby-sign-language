"use client";

import {useEffect, useState} from "react";

export default function List({params}) {

  const {list_id: listId} = params;

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
                list.signs.map(signId => (
                  <li key={signId}>{signId}</li>
                )) :
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
