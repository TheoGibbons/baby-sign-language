"use client";

import {useContext, useEffect, useRef, useState} from "react";
import Image from 'next/image'
import {AuthProviderContext} from "@/app/components/AuthProvider";
import Link from "next/link";
import LogoLink from "@/app/components/LogoLink";
import {CiLogout, CiSearch} from "react-icons/ci";
import {AiOutlineSave} from "react-icons/ai";
import {FiMinus} from "react-icons/fi";
import {IoAdd} from "react-icons/io5";
import {YouTubeEmbed} from "@/components/YouTubeEmbed";
import {useRouter} from "next/navigation";

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
    .then(r => {

      if (r?.success) {
        setLists(r.lists);
      } else if (r?.userLoggedOut || (r?.errors && r.errors.includes('User not found'))) {
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        alert('Failed to get lists');
      }

    })
    .catch(() => alert("Website inaccessible. Failed to get lists."))
}

export default function Body({signs, signSlug}) {
  const [sign, setSign] = useState();
  const [lists, setLists] = useState([]);
  const router = useRouter();

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
        setSign("Sign not found");
        return;
      }

      if (!sign) {
        // No sign slug provided or sign provided not found, so pick a random sign
        const randomSign = signs[Math.floor(Math.random() * signs.length)];
        setSign(randomSign)
      }

    }
  }, [signs, signSlug, sign]);

  useEffect(() => {
    console.log(sign);    // Why does this trigger twice
    if (sign) {

      // Change the url to match the selected sign
      // history.replaceState({}, null, `/${sign.slug}`);
      router.replace(`/${sign.slug}`, undefined, { shallow: true });

      console.log('router', `${sign.slug}`);

    }
  }, [sign, router]);

  const searchOnChange = (event) => {
    const mySign = searchForSign(event.target.value, signs)
    console.log(event.target.value, mySign)
    if (mySign) {

      // TODO This bug
      // Why does this cause useEffect to be triggered twice? Once with the old value and once with the new value
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
      .then(r => {
        if (r?.success) {
          const user = r.user;
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
        } else {
          alert('Login failed');
        }
      })
      .catch(() => alert("Website inaccessible. Login failed."))
  }

  const logout = (event = null) => {
    event?.preventDefault();
    localStorage.removeItem('user');
    setUser(null);
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
      .then(r => {

        if (r?.success) {
          setLists((prevItems) => [...prevItems, r.list]);
          event.target.reset()
        } else {
          alert('List creation failed');
        }

      })
      .catch(() => alert("Website inaccessible. Failed to create list."))
  }

  useEffect(() => {
    if (user) {
      refreshLists(setLists);
    }
  }, [user]);

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
      .then(r => {
        if (!r.success) {
          refreshLists(setLists)
          alert('Failed to update list.');
        }
      })
      .catch(() => alert("Website inaccessible. Failed to update list."))

  }

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {signs && (
        <>
          <div className="flex items-center mb-4 gap-2">

            <LogoLink/>

            <label htmlFor="search" className="sr-only">
              Search:
            </label>
            <div className="flex grow">
              <input
                list="signs-datalist"
                id="search"
                onChange={searchOnChange}
                className="flex-grow px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search signs..."
              />
              <button
                className="px-4 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-l-0"
              >
                <CiSearch/>
              </button>
            </div>

          </div>

          <datalist id="signs-datalist">
            {signs.map((thisSign) => (
              <option value={thisSign.name} key={thisSign.id}/>
            ))}
          </datalist>
        </>
      )}

      {typeof sign === 'string' ? (
        <div className="mt-6 text-lg font-semibold">{sign}</div>
      ) : (
        sign && (
          <div className="mt-6 relative">

            <div className="absolute right-0" ref={menuRef}>
            <span className="relative group">
              <button className="ml-2 px-4 py-2 text-white bg-blue-400 rounded-tr-lg hover:bg-blue-600 text-2xl"
                      onClick={() => setMenuOpen(!menuOpen)}
              >
                +
              </button>
              {menuOpen && (
                user ? (
                  <>
                    <div
                      className="absolute top-full right-0 w-80 mt-2 p-4 bg-white border rounded-lg shadow-lg">
                      <div className="mb-4 text-gray-700">
                        Add <strong>{sign?.name}</strong> to one of your lists.
                      </div>
                      {lists.map((list) => (
                        <div key={list.id}
                             className="flex justify-between mb-2 bg-gray-50 border rounded items-stretch">

                          <Link href={`/lists/${encodeURIComponent(list.id)}`}
                                className="text-blue-600 hover:underline m-2">
                            {list.name}
                          </Link>

                          <div className="">
                            {listContainsSign(list, sign) ? (
                              <button
                                onClick={() => toggleSignInList(list.id, sign.id, false)}
                                className="text-white hover:bg-red-700 bg-red-500 h-full px-4 rounded-r"
                                title={`Remove "${sign.name}" from "${list.name}"`}
                              >
                                <FiMinus size={20}/>
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleSignInList(list.id, sign.id, true)}
                                className="text-white hover:bg-green-700 bg-green-500 h-full px-4 rounded-r"
                                title={`Add "${sign.name}" to "${list.name}"`}
                              >
                                <IoAdd size={20}/>
                              </button>
                            )}
                          </div>

                        </div>
                      ))}

                      <div className="mt-4">
                        <form onSubmit={createNewList} className="flex">
                          <input
                            placeholder="New List"
                            id="new-list"
                            required
                            className="w-full px-2 py-1 border rounded-l-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-green-500 text-white rounded-r-lg hover:bg-green-600 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 border-l-0"
                          >
                            <AiOutlineSave size={20}/>
                          </button>
                        </form>

                      </div>

                      <hr className="mt-5"/>

                      <div className="mt-4">
                        <form onSubmit={logout} className="flex justify-end">
                          <button
                            className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-green-600 flex items-center gap-2">
                            Logout
                            <CiLogout/>
                          </button>
                        </form>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute top-full right-0 w-64 mt-2 p-4 bg-white border rounded-lg shadow-lg">
                    <form onSubmit={attemptToLogUserIn} className="space-y-2">
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium">
                          Login:
                        </label>
                        <input
                          type="text"
                          id="username"
                          placeholder="Username"
                          required
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <input
                        type="submit"
                        value="Login"
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                      />
                    </form>
                  </div>
                )
              )}
            </span>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="text-xl font-bold">{sign.name}</div>
              <a href={sign.url} className="text-blue-600 hover:underline">
                {sign.url}
              </a>
              <div className="mt-2 text-gray-600">{sign.description}</div>
            </div>
            <div className="mt-4">
              {sign?.imageFile?.local_path ? (
                <Image
                  src={sign.imageFile.local_path}
                  alt={sign?.name}
                  width={500}
                  height={500}
                  className="w-full rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-gray-500">No image available</div>
              )}
            </div>
            <div className="flex justify-center mt-10">
              <YouTubeEmbed url={sign?.youtube_url} title={`YouTube ${sign?.name}`}/>
            </div>
          </div>
        )
      )}
    </div>
  );


}
