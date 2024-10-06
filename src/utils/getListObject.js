import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

export default async function getListObject(listId) {
  // Fetch the list along with its associated signs
  const list = await prisma.lists.findUnique({
    where: { id: listId },
    select: {
      id: true,
      name: true,
      updated_at: true,
      signs: { // Query the related signs directly
        select: { id: true },
      },
    },
  });

  if (!list) {
    throw new Error('List not found');
  }

  // Extract sign IDs from the signs relation
  const signs = list.signs.map((sign) => sign.id);

  return {
    ...list,
    signs,
  };
}
