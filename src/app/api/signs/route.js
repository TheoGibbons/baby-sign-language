import getAllSigns from "@/utils/getAllSigns";
import React from "react";

export async function GET() {

  const {signs, error} = await getAllSigns();

  if (error) {
    console.error('Error fetching signs:', error);
    return new Response(
      JSON.stringify({
        success: false,
        errors: ['Failed to get signs'],
      }),
      {status: 500, headers: {'Content-Type': 'application/json'}}
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      signs: signs,
    }),
    {headers: {'Content-Type': 'application/json'}}
  );
}
