"use client";

import {useContext, useEffect, useRef, useState} from "react";
import Link from "next/link";
import {AuthProviderContext} from "@/app/components/AuthProvider";
import {AiOutlineSave} from "react-icons/ai";
import {CiLogout, CiUser} from "react-icons/ci";

export default function ProfileMenu({onListCreated}) {
  const {user, setUser} = useContext(AuthProviderContext);
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const menuRef = useRef(null);

  const refreshLists = () => {
    setListsLoading(true);

    fetch("/api/lists", {method: "GET"})
      .then(r => r.json())
      .then(r => {
        if (r?.success) {
          setLists(r.lists);
        } else if (r?.userLoggedOut || (r?.errors && r.errors.includes("User not found"))) {
          localStorage.removeItem("user");
          window.location.reload();
        } else {
          alert("Failed to get lists");
        }
      })
      .catch(() => alert("Website inaccessible. Failed to get lists."))
      .finally(() => setListsLoading(false));
  };

  useEffect(() => {
    if (user) {
      refreshLists();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const attemptToLogUserIn = (event) => {
    event.preventDefault();
    setLoggingIn(true);

    const username = event.target.querySelector("input").value;

    fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({username}),
      headers: {"Content-Type": "application/json"},
    })
      .then(r => r.json())
      .then(r => {
        if (r?.success) {
          localStorage.setItem("user", JSON.stringify(r.user));
          setUser(r.user);
        } else {
          alert("Login failed");
        }
      })
      .catch(() => alert("Website inaccessible. Login failed."))
      .finally(() => setLoggingIn(false));
  };

  const logout = (event) => {
    event.preventDefault();
    fetch("/api/logout", {method: "POST"})
      .finally(() => {
        localStorage.removeItem("user");
        setUser(null);
        setOpen(false);
      });
  };

  const promptToCreateList = () => {
    const listName = prompt("Enter a name for the new list");

    if (!listName) {
      return;
    }

    setListsLoading(true);
    fetch("/api/lists/new", {
      method: "POST",
      body: JSON.stringify({listName}),
      headers: {"Content-Type": "application/json"},
    })
      .then(r => r.json())
      .then(r => {
        if (r?.success) {
          setLists((previousLists) => [...previousLists, r.list]);
          onListCreated?.(r.list);
        } else {
          alert("List creation failed");
        }
      })
      .catch(() => alert("Website inaccessible. Failed to create list."))
      .finally(() => setListsLoading(false));
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="h-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border"
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(!open)}
        aria-label="Profile"
      >
        <CiUser/>
      </button>
      {open && (
        user ? (
          <div className="absolute top-full right-0 z-20 w-80 mt-2 p-4 bg-white dark:bg-gray-900 border rounded-lg shadow-lg">
            <div className="mb-4 font-semibold text-gray-700 dark:text-white flex justify-between">
              Lists <small className="text-gray-400">{user.username}</small>
            </div>
            {listsLoading ? (
              <div className="mb-2 text-gray-600 dark:text-gray-300" role="status">
                Loading lists...
              </div>
            ) : lists.length ? (
              lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${encodeURIComponent(list.id)}`}
                  className="block mb-2 p-2 bg-gray-50 dark:bg-gray-900 border rounded text-blue-600 hover:underline dark:text-custom-blue-text"
                  onClick={() => setOpen(false)}
                >
                  {list.name}
                </Link>
              ))
            ) : (
              <div className="mb-2 text-gray-600 dark:text-gray-300">No lists yet</div>
            )}

            <hr className="mt-5"/>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={promptToCreateList}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                Create New List
                <AiOutlineSave/>
              </button>
              <form onSubmit={logout}>
                <button className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-600 flex items-center gap-2">
                  Logout
                  <CiLogout/>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="absolute top-full right-0 z-20 w-64 mt-2 p-4 bg-white dark:bg-gray-900 border rounded-lg shadow-lg">
            <form onSubmit={attemptToLogUserIn} className="space-y-2">
              <div>
                <label htmlFor="profile-username" className="block text-sm font-medium">
                  Login:
                </label>
                <input
                  type="text"
                  id="profile-username"
                  placeholder="Username"
                  required
                  disabled={loggingIn}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                />
              </div>
              {loggingIn ? (
                <div className="text-center" role="status">Logging in...</div>
              ) : (
                <input
                  type="submit"
                  value="Login"
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                />
              )}
            </form>
          </div>
        )
      )}
    </div>
  );
}
