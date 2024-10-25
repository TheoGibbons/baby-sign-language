"use client";

import {useEffect, useState} from 'react';
import {addPropsToComponent} from "@/utils/AddPropsToComponent";

export default function SignsProvider({component}) {

  const [signs, setSigns] = useState(null);

  useEffect(() => {

    const signs = localStorage.getItem('signs')

    if (signs) {

      setSigns(JSON.parse(signs));

    } else {

      fetch('/api/signs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      })
        .then(r => r.json())
        .then(r => {
          if (r?.success) {

            localStorage.setItem('signs', JSON.stringify(r.signs));

            setSigns(r.signs);
          } else {
            alert('Failed to get signs' + (r.errors ? "\n" + r.errors?.join("\n") : ''));
          }
        })
        .catch(() => alert("Website inaccessible. Login failed."))
    }

  }, []);

  if (signs) {
    // Pass the random sign to the client component for redirection
    return addPropsToComponent(component, {signs});
  } else {
    return "Loading signs...";
  }

}
