import {cookies} from "next/headers";
import {neon} from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const validation = async (userId, listId, signId) => {

  // Check the user exists
  const user = await sql`
      SELECT id
      FROM users
      WHERE id = ${userId};
  `;

  if (!user.length) {
    return ['User not found'];
  }

  // Check the list exists
  const list = await sql`
      SELECT id
      FROM lists
      WHERE id = ${listId};
  `;

  if (!list.length) {
    return ['List not found'];
  }

  // Check the sign exists
  const sign = await sql`
      SELECT id
      FROM signs
      WHERE id = ${signId};
  `;

  if (!sign.length) {
    return ['Sign not found'];
  }

  return null;

}

export async function DELETE(request, {params}) {

  const userId = cookies().get('user_id')?.value
  const {list_id: listId, sign_id: signId} = params;

  // Validation
  const validationErrors = await validation(userId, listId, signId);
  if (validationErrors) {
    return Response.json({
      success: false,
      errors: validationErrors
    })
  }

  // Delete the sign from the list
  await sql`
      DELETE
      FROM "_ListSign"
      WHERE "A" = ${listId}
        AND "B" = ${signId};
  `;

  return Response.json({
    success: true
  })
}

export async function POST(request, {params}) {

  const userId = cookies().get('user_id')?.value
  const {list_id: listId, sign_id: signId} = params;

  // Validation
  const validationErrors = await validation(userId, listId, signId);
  if (validationErrors) {
    return Response.json({
      success: false,
      errors: validationErrors
    })
  }

  // Add the sign to the list
  await sql`
      INSERT INTO "_ListSign" ("A", "B")
      VALUES (${listId}, ${signId});
  `;

  return Response.json({
    success: true
  })
}