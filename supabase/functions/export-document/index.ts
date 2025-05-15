
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { projectId, format, options, projectName, sections, files } = await req.json();
    
    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    if (!projectId || !format) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate a filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `PT2030_${projectName.replace(/\s+/g, '_')}_${timestamp}.${format}`;
    
    // In a real implementation, this would generate a document
    // For now, we'll simulate the export process
    
    // Create a document record
    const { data, error } = await supabaseAdmin
      .from('exported_documents')
      .insert({
        project_id: projectId,
        file_name: fileName,
        format,
        status: 'completed',
        options: options || {},
        sections_count: sections?.length || 0,
        files_count: files?.length || 0
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Generate a fake download URL
    const downloadUrl = `https://example.com/downloads/${fileName}`;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        url: downloadUrl,
        fileName,
        pageCount: sections?.length || 0
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
