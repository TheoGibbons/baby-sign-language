import React from 'react';
import Body from "./Body";
import getAllSigns from "@/utils/getAllSigns";

// This is a server component in Next.js
export default async function Home({params}) {

  // Get the slug from the url if one is provided
  const listId = params.list_id

  const {signs, error} = await getAllSigns();

  if (error) {
    console.error('Error fetching signs:', error);
    return <div>Error loading signs...</div>;
  }

  if (!signs) return "No signs found in database";

  // Pass the random sign to the client component for redirection
  return <Body signs={signs} listId={listId}/>;

}
