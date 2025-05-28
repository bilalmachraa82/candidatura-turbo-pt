
// This file is kept for compatibility but functionality moved to Supabase Edge Functions
// The actual generation is now handled by supabase/functions/generate-text/index.ts

export async function handler(req: Request) {
  return new Response(JSON.stringify({ 
    error: 'This endpoint has been moved to Supabase Edge Functions',
    message: 'Use /functions/v1/generate-text instead'
  }), {
    status: 410,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export default handler;
