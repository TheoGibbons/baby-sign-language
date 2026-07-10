"use client";

import {useContext, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {AuthProviderContext} from "@/app/components/AuthProvider";

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function Body({username, listId}) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const {setUser} = useContext(AuthProviderContext);

  useEffect(() => {
    fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({username: safeDecode(username)}),
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then(r => r.json())
      .then(r => {
        if (r?.success) {
          localStorage.setItem('user', JSON.stringify(r.user));
          setUser(r.user);
          router.replace(`/lists/${encodeURIComponent(listId)}`);
        } else {
          setError('Login failed');
        }
      })
      .catch(() => setError('Website inaccessible. Login failed.'));
  }, [listId, router, username, setUser]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {error || "Logging in..."}
    </div>
  );
}
