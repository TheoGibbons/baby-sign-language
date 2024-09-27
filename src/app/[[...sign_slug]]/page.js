import {neon} from "@neondatabase/serverless";
import HomeClient from "./components/HomeClient";

// This is a server component
export default async function Home({params}) {
  // Fetch the random sign from the database (on the server)
  const sql = neon(process.env.DATABASE_URL);
  const signs = await sql`
      SELECT *
      FROM signs
  `;

  if (!signs) return "No signs found";

  // Get the slug from the url if one is provided
  const signSlug = params.sign_slug?.[0]

  // Pass the random sign to the client component for redirection
  return <HomeClient signs={signs} signSlug={signSlug}/>;
}