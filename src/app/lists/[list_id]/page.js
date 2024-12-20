import React from 'react';
import SignsProvider from "../../components/SignsProvider";
import Body from "./Body";

export default async function Home({params}) {
  return <SignsProvider component={
    <Body listId={params.list_id}/>
  }/>;
}
