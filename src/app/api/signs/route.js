import getAllSigns from "@/utils/getAllSigns";
import React from "react";

// A parameterless GET handler is prerendered at build time by default, which
// froze this response into the deployed bundle. That is wrong twice over: the
// sign list could only change with a redeploy, and an image build without a
// reachable database baked a permanent 500 in here instead.
export const dynamic = 'force-dynamic';

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
