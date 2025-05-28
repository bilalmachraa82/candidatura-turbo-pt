
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test OpenAI API connection
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return new Response(JSON.stringify({
        success: false,
        message: 'OPENAI_API_KEY não configurada',
        configured: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test the API key
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
    });

    if (!testResponse.ok) {
      throw new Error(`OpenAI API test failed: ${testResponse.status}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'OpenAI API configurada corretamente',
      configured: true,
      models: ['text-embedding-3-small', 'text-embedding-3-large']
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error testing OpenAI setup:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Erro na configuração OpenAI: ${error.message}`,
      configured: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
