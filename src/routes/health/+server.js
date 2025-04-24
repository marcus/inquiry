/** @type {import('@sveltejs/kit').RequestHandler} */
export function GET() {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
