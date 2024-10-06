import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import getListObject from "@/utils/getListObject";

// Initialize Prisma client
const prisma = new PrismaClient();

// Validation function to check if user exists and list name is unique
const validateCreateListRequest = async (userId, listName) => {
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

  // Check if the list name is already taken for this user
  const list = await prisma.lists.findFirst({
    where: {
      user_id: user.id,
      name: listName,
    },
    select: { id: true },
  });

  if (list) {
    return ['List name already taken'];
  }

  return null;
};

export async function POST(request) {
  try {
    // Get the post data from the request body
    const { listName } = await request.json();
    const userId = cookies().get('user_id')?.value;

    // Validation
    const validationErrors = await validateCreateListRequest(userId, listName);
    if (validationErrors) {
      return new Response(
        JSON.stringify({
          success: false,
          errors: validationErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create the new list
    const list = await prisma.lists.create({
      data: {
        id: crypto.randomUUID(), // Use crypto to generate a UUID or another method
        name: listName,
        user_id: userId,
        updated_at: new Date(),
      },
      select: { id: true },
    });

    // Get the list object for response
    const listObject = await getListObject(list.id);

    return new Response(
      JSON.stringify({
        success: true,
        list: listObject,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error creating list:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create the list',
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    // Disconnect Prisma client after operation
    await prisma.$disconnect();
  }
}
