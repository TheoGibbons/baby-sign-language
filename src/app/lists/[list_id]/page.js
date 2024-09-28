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
      .catch(() => alert("Website inaccessible."))
      .then(r => {
        if (r.success) {
          setList(r.list);
        }
      })

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
      .catch(() => alert("Website inaccessible."))
      .then(r => {

        if (r.success) {
          setList(r.list);
        } else {
          alert('List rename failed');
        }

      })

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
                list.signs.map(sign => (
                  <li key={sign.id}>{sign.id}</li>
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
