"use client";

import {useContext, useEffect, useState} from "react";
import Image from 'next/image'
import {AuthProviderContext} from "@/app/components/AuthProvider";

const easyCompare = (str1, str2) => str1.toLowerCase().trim() === str2.toLowerCase().trim();

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
      .catch(e => alert("Website inaccessible."))
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
      .catch(e => alert("Website inaccessible."))
      .then(r => {

        if (r.success) {
          setLists((prevItems) => [...prevItems, r.list]);
        } else {
          alert('List creation failed');
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

      <div>
        <button>+</button>
        {user ?
          <div>

            {lists.map(list => (
              <div>
                {list.name}
                {listContainsSign(list, sign) ? <button>-</button> : <button>+</button>}
              </div>
            ))}

            <div>
              <form onSubmit={createNewList}>
                <input placeholder="New List" required/>
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
              <Image src={sign.image_url} alt={sign?.name} width={500}></Image> :
              "No image available"
            }
          </div>
        </div>
      }

    </div>
  );
}
