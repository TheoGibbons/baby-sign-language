"use client";

import {createContext, useEffect, useState} from "react";

export const AuthProviderContext = createContext();

export default function AuthProvider({children}) {

  const [user, setUser] = useState();

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user')));
  }, []);

  return (
    <AuthProviderContext.Provider value={{user, setUser}}>
      {children}
    </AuthProviderContext.Provider>
  );
}