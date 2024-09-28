import {cookies} from "next/headers";
import {neon} from "@neondatabase/serverless";
import getListObject from "@/utils/getListObject";

const sql = neon(process.env.DATABASE_URL);

const validationPatch = async (userId, listId, name) => {

  if (!name) {
    return ['List name is required'];
  }

  return validation(userId, listId);
}

const validation = async (userId, listId) => {

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

  // Check the list belongs to the user
  const listUser = await sql`
      SELECT id
      FROM lists
      WHERE id = ${listId}
        AND user_id = ${userId};
  `;

  if (!listUser.length) {
    return ['List not found'];
  }

  return null;
}

export async function DELETE(request, {params}) {

  const userId = cookies().get('user_id')?.value
  const {list_id: listId} = params;

  // Validation
  const validationErrors = await validation(userId, listId);
  if (validationErrors) {
    return Response.json({
      success: false,
      errors: validationErrors
    })
  }

  // Delete the list
  await sql`
      DELETE
      FROM lists
      WHERE id = ${listId};
  `;

  return Response.json({
    success: true
  })
}

export async function GET(request, {params}) {

  const userId = cookies().get('user_id')?.value
  const {list_id: listId} = params;

  // Validation
  const validationErrors = await validation(userId, listId);
  if (validationErrors) {
    return Response.json({
      success: false,
      errors: validationErrors
    })
  }

  const listObject = await getListObject(listId);

  return Response.json({
    success: true,
    list: listObject
  })

}

export async function PATCH(request, {params}) {

  const {name} = await request.json();
  const userId = cookies().get('user_id')?.value
  const {list_id: listId} = params;

  // Validation
  const validationErrors = await validationPatch(userId, listId, name);
  if (validationErrors) {
    return Response.json({
      success: false,
      errors: validationErrors
    })
  }

  // Update the list
  await sql`
      UPDATE lists
      SET updated_at = NOW(),
          name       = ${name}
      WHERE id = ${listId};
  `;


  const listObject = await getListObject(listId);

  return Response.json({
    success: true,
    list: listObject
  })

}