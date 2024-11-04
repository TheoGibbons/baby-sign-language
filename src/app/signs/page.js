import React from 'react';
import SignsProvider from "../components/SignsProvider";
import Body from "./Body";

export default async function Home() {
  return <SignsProvider component={
    <Body/>
  }/>;
}
