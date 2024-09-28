"use client";

import {useContext, useEffect, useState} from "react";
import Image from 'next/image'
import {AuthProviderContext} from "@/app/components/AuthProvider";
import Link from "next/link";

const easyCompare = (str1, str2) => str1.toLowerCase().trim() === str2.toLowerCase().trim();

const listContainsSign = (list, sign) => !!list.signs.find(s => s.id === sign.id)

const searchForSign = (searchString, signs) => {

  // Does the search string exactly match a sign name
  const signsWhereNameExactlyMatches = signs.filter(sign => easyCompare(sign.name, searchString));
  if (signsWhereNameExactlyMatches.length === 1) {
    return signsWhereNameExactlyMatches[0];
  }

  // Does the search string exactly match a sign slug
  const signsWhereSlugExactlyMatches = signs.filter(sign => easyCompare(sign.slug, searchString));
  if (signsWhereSlugExactlyMatches.length === 1) {
    return signsWhereSlugExactlyMatches[0];
  }

  // Get all sign names that start with the search string
  const signsWhereNameStartsSearchString = signs.filter(sign => sign.name.toLowerCase().trim().startsWith(searchString.toLowerCase().trim()));
  if (signsWhereNameStartsSearchString.length === 1) {
    return signsWhereNameStartsSearchString[0];
  }

  return null;
}

function refreshLists(setLists) {
  fetch(`/api/lists`, {
    method: 'GET'
  })
    .then(r => r.json())
    .catch(() => alert("Website inaccessible."))
    .then(r => {

      if (r.success) {
        setLists(r.lists);
      } else {
        alert('Failed to get lists');
      }

    })
}

export default function HomeClient({signs, signSlug}) {
  const [sign, setSign] = useState();
  const [lists, setLists] = useState([]);

  useEffect(() => {
    if (signs) {

      if (signSlug) {
        // Sign slug provided so return the matching sign
        for (const sign of signs) {
          if (sign.slug === signSlug) {
            setSign(sign);
            return;
          }
        }
      }

      // No sign slug provided or sign provided not found, so pick a random sign
      const randomSign = signs[Math.floor(Math.random() * signs.length)];
      setSign(randomSign)

    }
  }, [signs, signSlug]);

  useEffect(() => {
    if (sign) {

      // Change the url to match the selected sign
      history.replaceState({}, null, `/${sign.slug}`);

    }
  }, [sign]);

  const searchOnChange = (event) => {
    const mySign = searchForSign(event.target.value, signs)
    if (mySign) {
      setSign(mySign);
    }
  }

  let {user, setUser} = useContext(AuthProviderContext);

  const attemptToLogUserIn = (event) => {
    event.preventDefault();

    const username = event.target.querySelector('input').value;

    fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({username}),
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then(r => r.json())
      .catch(() => alert("Website inaccessible."))
      .then(r => {
        if (r.success) {
          const user = r.user;
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
        } else {
          alert('Login failed');
        }
      })
  }

  const createNewList = (event) => {
    event.preventDefault();

    const listName = event.target.querySelector('input').value;

    fetch('/api/lists/new', {
      method: 'POST',
      body: JSON.stringify({listName}),
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then(r => r.json())
      .catch(() => alert("Website inaccessible."))
      .then(r => {

        if (r.success) {
          setLists((prevItems) => [...prevItems, r.list]);
        } else {
          alert('List creation failed');
        }

      })
  }

  useEffect(() => {
    if (user) {
      refreshLists(setLists);
    }
  }, [user]);

  const deleteList = (list) => {

    if (confirm(`Are you sure you want to delete your "${list.name}" list?`)) {

      setLists((prevItems) => prevItems.filter(item => item.id !== list.id));

      fetch(`/api/lists/${list.id}`, {
        method: 'DELETE'
      })
        .then(r => r.json())
        .catch(() => alert("Website inaccessible."))
        .then(r => {
          if (!r.success) {
            refreshLists(setLists)
            alert('Failed to delete list');
          }
        })
    }

  }

  const toggleSignInList = (listId, signId, addOrRemove) => {

    // Update the list locally
    setLists((prevItems) => prevItems.map(list => {
      if (list.id === listId) {

        if (addOrRemove) {
          list.signs.push({id: signId});
        } else {
          list.signs = list.signs.filter(sign => sign.id !== signId);
        }

      }
      return list;
    }));

    // Update the list on the server
    fetch(`/api/lists/${listId}/signs/${signId}`, {
      method: addOrRemove ? 'POST' : 'DELETE'
    })
      .then(r => r.json())
      .catch(() => alert("Website inaccessible."))
      .then(r => {
        if (!r.success) {
          refreshLists(setLists)
          alert('Failed to update list.');
        }
      })

  }

  return (
    <div>

      {signs &&
        <>
          <label htmlFor="search" className="sr-only">Search:</label>
          <input list="signs-datalist" id="search" onChange={searchOnChange}/>

          <datalist id="signs-datalist">
            {signs.map(sign => <option value={sign.name} key={sign.id}/>)}
          </datalist>
        </>
      }

      <div className="pl-[500px]">
        <span className="relative group border">
          <button>+</button>
          {user ?
            <div className="absolute top-full right-0 hidden group-hover:block border">

              {lists.map(list => (
                <div key={list.id}>
                  <Link href={`/lists/${encodeURIComponent(list.id)}`}>{list.name}</Link>
                  {listContainsSign(list, sign) ?
                    <button onClick={() => toggleSignInList(list.id, sign.id, false)}>-</button> :
                    <button onClick={() => toggleSignInList(list.id, sign.id, true)}>+</button>
                  }
                  <button onClick={() => deleteList(list)}>delete list</button>
                </div>
              ))}

              <div>
                <form onSubmit={createNewList}>
                  <label htmlFor="new-list">New List:</label>
                  <input placeholder="New List" id="new-list" required/>
                  <button>save</button>
                </form>
              </div>

            </div> :
            <div>
              <form onSubmit={attemptToLogUserIn}>
                <label htmlFor="username">Login:</label>
                <input type="text" id="username" placeholder="Username" required/>
                <input type="submit" value="Login"/>
              </form>
            </div>
          }
        </span>
      </div>

      {sign &&
        <div>
          <div>
            <div>
              <div>{sign.name}</div>
              <a href={sign.url}>{sign.url}</a>
            </div>
            <div>{sign.desciption}</div>
          </div>
          <div>
            {sign.image_url ?
              <Image src={sign.image_url} alt={sign?.name} width={500} height={500}></Image> :
              "No image available"
            }
          </div>
        </div>
      }

    </div>
  );
}
