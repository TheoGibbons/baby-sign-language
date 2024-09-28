import {neon} from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function getListObject(listId) {

  // Create the new list
  const list = await sql`
      SELECT id, name, updated_at
      FROM lists
      WHERE id = ${listId};
  `;

  // now get all sings for this list
  const listSigns = await sql`
      SELECT s.id
      FROM signs s
               JOIN "_ListSign" ls ON s.id = ls."B"
      WHERE ls."A" = ${list[0].id};
  `;

  return {
    ...list[0],
    signs: listSigns
  }

}