import {neon} from "@neondatabase/serverless";
import {cookies} from "next/headers";
import getListObject from "@/utils/getListObject";

const sql = neon(process.env.DATABASE_URL);

const validateCreateListRequest = async (userId, listName) => {

  // Check the user exists
  const user = await sql`
      SELECT id
      FROM users
      WHERE id = ${userId};
  `;

  if (!user.length) {
    return ['User not found'];
  }

  // Check the list name isn't taken for this user
  const list = await sql`
      SELECT id
      FROM lists
      WHERE user_id = ${user.id}
        AND name = ${listName};
  `;

  if (list.length) {
    return ['List name already taken'];
  }

  return null;
}

export async function POST(request) {

  // Get post data
  const {listName} = await request.json();
  const userId = cookies().get('user_id')?.value

  // Validation
  const validationErrors = await validateCreateListRequest(userId, listName);
  if (validationErrors) {
    return Response.json({
      success: false,
      errors: validationErrors
    })
  }

  // Create the new list
  const list = await sql`
      INSERT INTO lists (id, name, user_id, updated_at)
      VALUES (uuid_generate_v4(), ${listName}, ${userId}, NOW()) RETURNING id;
  `;

  const listObject = await getListObject(list[0].id);

  return Response.json({
    success: true,
    list: listObject
  })

}