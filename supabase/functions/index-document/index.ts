
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.1';
import { extract } from 'https://esm.sh/extract-pdf-text@0.1.2';

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
    const { fileId, projectId, fileUrl, fileName, fileType } = await req.json();
    
    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    if (!fileId || !projectId || !fileUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Download file content
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }
    
    const fileBuffer = await fileResponse.arrayBuffer();
    
    let text = '';
    const chunkSize = 2000; // characters per chunk
    
    // Extract text based on file type
    if (fileType === 'application/pdf') {
      // Extract text from PDF
      const pdfText = await extract(new Uint8Array(fileBuffer));
      text = pdfText || '';
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      // For Excel files, we'd use a different extraction method
      text = 'Excel data extraction placeholder';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      // For Word files
      text = 'Word document extraction placeholder';
    } else {
      // For plain text files
      const decoder = new TextDecoder();
      text = decoder.decode(fileBuffer);
    }
    
    // Split text into chunks
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.substring(i, i + chunkSize);
      chunks.push(chunk);
    }
    
    // Store chunks in document_chunks table
    for (let i = 0; i < chunks.length; i++) {
      const { error } = await supabaseAdmin
        .from('document_chunks')
        .insert({
          project_id: projectId,
          file_id: fileId,
          chunk_index: i,
          content: chunks[i],
          metadata: {
            source: fileName,
            chunk: i + 1,
            total_chunks: chunks.length
          }
        });
      
      if (error) {
        throw error;
      }
    }
    
    // Update the file status
    const { error } = await supabaseAdmin
      .from('indexed_files')
      .update({ 
        status: 'indexed',
        chunks_count: chunks.length,
        indexed_at: new Date().toISOString()
      })
      .eq('id', fileId);
    
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({ success: true, chunks: chunks.length }), 
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
