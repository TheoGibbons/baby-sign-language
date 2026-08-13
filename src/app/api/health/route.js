// Liveness probe for the container health check and for Traefik's load-balancer
// health check. It deliberately does not touch PostgreSQL: a database outage
// should not pull the container out of routing while every static page, the
// service worker and the cached sign list still work.
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({status: 'ok'});
}
