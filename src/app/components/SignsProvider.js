"use client";

import {useEffect, useState} from 'react';
import {addPropsToComponent} from "@/utils/AddPropsToComponent";

const getCachedSigns = function getCachedSigns() {
  const currentVersionOfTheCache = localStorage.getItem('cache_version');
  const currentCacheVersion = process.env.NEXT_PUBLIC_CACHE_VERSION;

  if (currentVersionOfTheCache) {
    if (currentVersionOfTheCache === currentCacheVersion) {
      return localStorage.getItem('signs')
    }
  }

  return null;
}

export default function SignsProvider({component}) {

  const [signs, setSigns] = useState(null);
  const [synonyms, setSynonyms] = useState(null);

  useEffect(() => {

    const cachedSigns = getCachedSigns();
    const signsRequest = cachedSigns
      ? Promise.resolve(JSON.parse(cachedSigns))
      : fetch('/api/signs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      })
        .then(r => r.json())
        .then(r => {
          if (!r?.success) {
            throw new Error(r.errors?.join("\n") || 'Failed to get signs');
          }

          localStorage.setItem('signs', JSON.stringify(r.signs));
          localStorage.setItem('cache_version', process.env.NEXT_PUBLIC_CACHE_VERSION);

          return r.signs;
        });

    const synonymsRequest = fetch('/static/data/sign-synonyms.json', {cache: 'no-store'})
        .then(r => {
          if (!r.ok) {
            throw new Error('Failed to load sign synonyms.');
          }

          return r.json();
        })
        .then(r => {
          if (!r || typeof r !== 'object' || Array.isArray(r)) {
            throw new Error('The sign synonym data is invalid.');
          }

          return r;
        });

    Promise.all([signsRequest, synonymsRequest])
      .then(([loadedSigns, loadedSynonyms]) => {
        setSigns(loadedSigns);
        setSynonyms(loadedSynonyms);
      })
      .catch((error) => alert(error.message || 'Failed to load signs.'));

  }, []);

  if (signs && synonyms) {
    // Pass the random sign to the client component for redirection
    return addPropsToComponent(component, {signs, synonyms});
  } else {
    return "Loading signs...";
  }

}
