import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import getListObject from "@/utils/getListObject";

// Initialize Prisma client
const prisma = new PrismaClient();

// Validation function to check if the user exists
const validation = async (userId) => {
  if (!userId) {
    return ['User ID is missing'];
  }

  // Check if the user exists
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return ['User not found'];
  }

  return null;
};

export async function GET() {
  // Get the user ID from the cookies
  const userId = cookies().get('user_id')?.value;

  // Validation
  const validationErrors = await validation(userId);
  if (validationErrors) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: validationErrors,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Fetch the lists associated with the user ID
  const lists = await prisma.lists.findMany({
    where: { user_id: userId },
    select: { id: true },
  });

  if (!lists.length) {
    return new Response(
      JSON.stringify({
        success: true,
        lists: [],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Return the lists after processing each list with `getListObject`
  return new Response(
    JSON.stringify({
      success: true,
      lists: await Promise.all(lists.map((list) => getListObject(list.id))),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
