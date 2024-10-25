import React from 'react';
import SignsProvider from "./components/SignsProvider";
import Body from "./[sign_slug]/Body";

export default async function Home() {
  return <SignsProvider component={
    <Body signSlug={null}/>
  }/>;
}
