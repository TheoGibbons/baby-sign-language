import {neon} from "@neondatabase/serverless";
import {cookies} from "next/headers";

const sql = neon(process.env.DATABASE_URL);

const validateCreateListRequest = async (username, listName) => {

  // Check the user exists
  const user = await sql`
      SELECT id
      FROM users
      WHERE username = ${username};
  `;

  if (!user) {
    return ['User not found'];
  }

  // Check the list name isn't taken for this user
  const list = await sql`
      SELECT id
      FROM lists
      WHERE userId = ${user.id}
        AND name = ${listName};
  `;

  if (list) {
    return ['List name already taken'];
  }

  return null;
}

const getUserIdFromUsername = async (username) => {
  const user = await sql`
      SELECT id
      FROM users
      WHERE username = ${username};
  `;

  return user.id;
}

export async function POST(request) {

  // Get post data
  const {listName} = await request.json();
  const username = cookies().get('username')

  // Validation
  const validationErrors = await validateCreateListRequest(username, listName);
  if (validationErrors) {
    return Response.json({
      success: false,
      errors: validationErrors
    })
  }

  const userId = await getUserIdFromUsername(username);

  // Create the new list
  const list = await sql`
      INSERT INTO lists (name, userId, updated_at)
      VALUES (${listName}, ${userId}, NOW()) RETURNING name, updated_at;
  `;

  return Response.json({
    success: true,
    'list': list[0]
  })

}