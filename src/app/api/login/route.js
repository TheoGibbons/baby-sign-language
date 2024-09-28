import {neon} from "@neondatabase/serverless";

export async function POST(request) {

  // Get post data
  const {username} = await request.json();

  // Create the user in the database
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown';
  const user_agent = request.headers.get('user-agent') || 'unknown';

  const sql = neon(process.env.DATABASE_URL);

  // Insert or update the user in the database and return the user
  const user = await sql`
      INSERT INTO users (id, username, sign_up_ip, sign_up_user_agent, last_ip, last_user_agent, last_login_at, updated_at)
      VALUES (uuid_generate_v4(), ${username}, ${ip}, ${user_agent}, ${ip}, ${user_agent}, NOW(), NOW()) 
      ON CONFLICT (username) 
      DO UPDATE SET
          last_ip = EXCLUDED.last_ip,
          last_user_agent = EXCLUDED.last_user_agent,
          last_login_at = NOW(),
          updated_at = NOW(),
          login_count = users.login_count + 1
      RETURNING id, username, login_count;
  `;

  return Response.json({
    success: true,
    'user': user[0]
  }, {
    headers: {
      'Set-Cookie': `user_id=${user[0].id}; Path=/; HttpOnly; SameSite=Strict; Secure`
    }
  });

}