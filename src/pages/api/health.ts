
// API endpoint for health check used by Railway
export default function handler(req: Request) {
  return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
