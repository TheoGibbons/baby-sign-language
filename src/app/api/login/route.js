import { PrismaClient } from "@prisma/client";

export async function POST(request) {
  const prisma = new PrismaClient();

  try {
    // Get post data
    const { username } = await request.json();

    // Get request headers for IP and user-agent
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Upsert the user in the database (insert if not exist, otherwise update)
    const user = await prisma.users.upsert({
      where: { username },
      update: {
        last_ip: ip,
        last_user_agent: userAgent,
        last_login_at: new Date(),
        updated_at: new Date(),
        login_count: {
          increment: 1,
        },
      },
      create: {
        id: crypto.randomUUID(), // Use crypto to generate UUID or use any UUID generation method
        username,
        sign_up_ip: ip,
        sign_up_user_agent: userAgent,
        last_ip: ip,
        last_user_agent: userAgent,
        last_login_at: new Date(),
        updated_at: new Date(),
        login_count: 1,
      },
      select: {
        id: true,
        username: true,
        login_count: true,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        user,
      }),
      {
        headers: {
          'Set-Cookie': `user_id=${user.id}; Path=/; HttpOnly; SameSite=Strict; Secure`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in POST request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create or update user',
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
