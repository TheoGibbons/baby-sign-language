import {neon} from "@neondatabase/serverless";
import {cookies} from "next/headers";
import getListObject from "@/utils/getListObject";

const sql = neon(process.env.DATABASE_URL);

const validation = async (userId) => {

  // Check the user exists
  const user = await sql`
      SELECT id
      FROM users
      WHERE id = ${userId};
  `;

  if (!user.length) {
    return ['User not found'];
  }

  return null;
}

export async function GET() {

  const userId = cookies().get('user_id')?.value

  // Validation
  const validationErrors = await validation(userId);
  if (validationErrors) {
    return Response.json({
      success: false,
      errors: validationErrors
    })
  }

  // Create the new list
  const lists = await sql`
      select id
      from lists
      where user_id = ${userId};
  `;

  return Response.json({
    success: true,
    lists: await Promise.all(lists.map(list => getListObject(list.id)))
  })

}