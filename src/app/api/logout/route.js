export async function POST() {
  return new Response(
    JSON.stringify({success: true}),
    {
      headers: {
        'Set-Cookie': 'user_id=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0',
        'Content-Type': 'application/json',
      },
    }
  );
}
