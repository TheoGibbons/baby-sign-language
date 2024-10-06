import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import getListObject from "@/utils/getListObject";

// Initialize Prisma client
const prisma = new PrismaClient();

// Validation for PATCH request
const validationPatch = async (userId, listId, name) => {
  if (!name) {
    return ['List name is required'];
  }
  return validation(userId, listId);
};

// Common validation function
const validation = async (userId, listId) => {
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

  // Check if the list exists and belongs to the user
  const list = await prisma.lists.findFirst({
    where: {
      id: listId,
      user_id: userId,
    },
    select: { id: true },
  });

  if (!list) {
    return ['List not found or does not belong to the user'];
  }

  return null;
};

// DELETE Request: Delete a list
export async function DELETE(request, { params }) {
  const userId = cookies().get('user_id')?.value;
  const { list_id: listId } = params;

  // Validation
  const validationErrors = await validation(userId, listId);
  if (validationErrors) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: validationErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Delete the list
  await prisma.lists.delete({
    where: { id: listId },
  });

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
}

// GET Request: Get a list
export async function GET(request, { params }) {
  const userId = cookies().get('user_id')?.value;
  const { list_id: listId } = params;

  // Validation
  const validationErrors = await validation(userId, listId);
  if (validationErrors) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: validationErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const listObject = await getListObject(listId);

  return new Response(
    JSON.stringify({
      success: true,
      list: listObject,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

// PATCH Request: Update a list
export async function PATCH(request, { params }) {
  const { name } = await request.json();
  const userId = cookies().get('user_id')?.value;
  const { list_id: listId } = params;

  // Validation
  const validationErrors = await validationPatch(userId, listId, name);
  if (validationErrors) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: validationErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Update the list
  await prisma.lists.update({
    where: { id: listId },
    data: {
      name: name,
      updated_at: new Date(),
    },
  });

  const listObject = await getListObject(listId);

  return new Response(
    JSON.stringify({
      success: true,
      list: listObject,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
