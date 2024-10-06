import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

// Initialize Prisma client
const prisma = new PrismaClient();

// Common validation function
const validation = async (userId, listId, signId) => {
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

  // Check if the list exists
  const list = await prisma.lists.findUnique({
    where: { id: listId },
    select: { id: true },
  });

  if (!list) {
    return ['List not found'];
  }

  // Check if the sign exists
  const sign = await prisma.signs.findUnique({
    where: { id: signId },
    select: { id: true },
  });

  if (!sign) {
    return ['Sign not found'];
  }

  return null;
};

// DELETE Request: Remove a sign from a list
export async function DELETE(request, { params }) {
  const userId = cookies().get('user_id')?.value;
  const { list_id: listId, sign_id: signId } = params;

  // Validation
  const validationErrors = await validation(userId, listId, signId);
  if (validationErrors) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: validationErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Delete the sign from the list
  await prisma.lists.update({
    where: { id: listId },
    data: {
      signs: {
        disconnect: { id: signId },
      },
    },
  });

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
}

// POST Request: Add a sign to a list
export async function POST(request, { params }) {
  const userId = cookies().get('user_id')?.value;
  const { list_id: listId, sign_id: signId } = params;

  // Validation
  const validationErrors = await validation(userId, listId, signId);
  if (validationErrors) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: validationErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Add the sign to the list
  await prisma.lists.update({
    where: { id: listId },
    data: {
      signs: {
        connect: { id: signId },
      },
    },
  });

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
}
