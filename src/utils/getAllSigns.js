import {PrismaClient} from "@prisma/client";

export default async function getAllSigns() {

  const prisma = new PrismaClient();

  try {

    // Fetch all signs from the 'signs' table
    let signs = await prisma.signs.findMany({
      include: {
        imageFile: {
          select: {
            id: true,
            local_path: true,
          },
        },
        thumbnailFile: {
          select: {
            id: true,
            local_path: true,
          },
        },
      },
    });

    if (!signs) return "No signs found";

    return {signs, error: null};

  } catch (error) {
    return {signs: null, error: error};
  } finally {
    // Ensure Prisma disconnects properly after fetching data
    await prisma.$disconnect();
  }


}