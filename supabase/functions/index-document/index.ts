
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock function to extract text from a file
async function extractTextFromFile(fileUrl: string, fileType: string): Promise<string> {
  console.log(`[Mock] Extracting text from ${fileType} file at URL: ${fileUrl}`);
  
  // Mock extraction based on file type
  if (fileType.includes('pdf')) {
    return `This is extracted text from a PDF file at ${fileUrl}. 
    In a real implementation, we would download the file and extract actual text content.
    This would be processed page by page and paragraph by paragraph.`;
  } 
  else if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('xlsx')) {
    return `This is extracted text from an Excel file at ${fileUrl}.
    In a real implementation, we would extract values from cells, sheets, and named ranges.
    Data would be organized by worksheets and structured in a meaningful way.`;
  }
  else {
    return `Text extracted from ${fileUrl}. This is a generic extraction for file type: ${fileType}.`;
  }
}

// Function to create text chunks from a document
function createTextChunks(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  
  // Simple chunking by character count with overlap
  const overlap = 200;
  let startIdx = 0;
  
  while (startIdx < text.length) {
    const chunk = text.substring(startIdx, startIdx + chunkSize);
    chunks.push(chunk);
    startIdx += (chunkSize - overlap);
    if (startIdx < 0) startIdx = 0;
  }
  
  return chunks;
}

// Function to generate embeddings (mock implementation)
async function generateEmbedding(text: string): Promise<number[]> {
  console.log(`[Mock] Generating embedding for text: ${text.substring(0, 50)}...`);
  
  // Create a mock embedding vector of 1536 dimensions
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
}

serve(async (req: Request) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  // Get Supabase client with admin privileges
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({
      error: 'Missing Supabase configuration'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Parse request body
    const { fileId, projectId, fileUrl, fileName, fileType } = await req.json();
    
    if (!fileId || !projectId || !fileUrl) {
      throw new Error('Missing required parameters');
    }

    console.log(`Processing file: ${fileName} (${fileType}) for project ${projectId}`);
    
    // Extract text content from the file
    const textContent = await extractTextFromFile(fileUrl, fileType);
    
    // Split the text into chunks
    const textChunks = createTextChunks(textContent);
    console.log(`Created ${textChunks.length} text chunks`);
    
    // Generate embeddings for each chunk and store in pgvector
    let chunkCount = 0;
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const embedding = await generateEmbedding(chunk);
      
      // Store the chunk and its embedding in the database
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert({
          project_id: projectId,
          file_id: fileId,
          chunk_index: i,
          content: chunk,
          metadata: {
            source: fileName,
            page: Math.floor(i / 2) + 1 // Mock page number
          },
          embedding: embedding
        });

      if (chunkError) {
        console.warn(`Warning: Error creating document chunk: ${chunkError.message}`);
      } else {
        chunkCount++;
      }
    }

    // Update file status to indexed
    const { error: updateError } = await supabase
      .from('indexed_files')
      .update({ status: 'indexed' })
      .eq('id', fileId);
      
    if (updateError) {
      console.warn(`Warning: Error updating file status: ${updateError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `File indexed successfully. Created ${chunkCount} document chunks.`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error(`Error in index-document function: ${error.message}`);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
