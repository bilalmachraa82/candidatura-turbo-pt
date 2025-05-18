
import { supabase } from '@/lib/supabase';
import { generateEmbedding } from './embeddings';

interface IndexingResult {
  success: boolean;
  documentId?: string;
  message: string;
  file?: {
    id: string;
    name: string;
    type: string;
    url: string;
  };
}

interface ExtractedText {
  text: string;
  pages: number;
}

// Função que vai extrair texto de um arquivo (PDF, DOCX, etc.)
// Esta é uma versão simplificada para POC. Em produção, usaria um serviço como
// AWS Textract, Azure Document Intelligence ou similar
const extractTextFromFile = async (file: File): Promise<ExtractedText> => {
  // Em um caso real, usaríamos um serviço para extrair texto de documentos
  // Por simplicidade neste MVP, simulamos a extração baseada no tipo do arquivo
  
  if (file.type.includes('pdf')) {
    return {
      text: `Conteúdo extraído do PDF ${file.name}. Este é um texto simulado para fins de demonstração.
      Em um ambiente de produção, o conteúdo real do documento seria extraído.
      Esta extração simulada contém informações genéricas sobre projetos PT2030.
      Programa de apoio à inovação tecnológica e investimentos em infraestrutura.
      Elegibilidade de despesas para pequenas e médias empresas.
      Requisitos para financiamento de projetos de digitalização e transição energética.`,
      pages: Math.floor(file.size / 50000) + 1 // estimativa baseada no tamanho
    };
  } 
  
  if (file.type.includes('word') || file.type.includes('docx')) {
    return {
      text: `Conteúdo extraído do Word ${file.name}. Este é um texto simulado para fins de demonstração.
      Em um ambiente de produção, o conteúdo real do documento seria extraído.
      Este documento contém informações sobre critérios de avaliação de projetos PT2030.
      Pontuação para impacto ambiental e social dos projetos candidatos.
      Métrica de avaliação para criação de emprego e desenvolvimento regional.
      Bonificação para projetos em regiões de baixa densidade populacional.`,
      pages: Math.floor(file.size / 40000) + 1
    };
  }
  
  if (file.type.includes('excel') || file.type.includes('sheet') || file.type.includes('xlsx')) {
    return {
      text: `Conteúdo extraído da planilha ${file.name}. Este é um texto simulado para fins de demonstração.
      Em um ambiente de produção, seriam extraídos valores de células, planilhas, e áreas nomeadas.
      Dados orçamentários de projetos, incluindo despesas elegíveis e não elegíveis.
      Projeções financeiras para período de 5 anos após implementação.
      Cálculos de ROI e tempo de retorno de investimento esperado.`,
      pages: Math.floor(file.size / 30000) + 1
    };
  }
  
  // Para outros tipos de arquivo, retornamos um texto genérico
  return {
    text: `Conteúdo extraído de ${file.name} (${file.type}). Em um ambiente de produção, 
    seria utilizado um serviço especializado para extração de texto deste tipo de documento.`,
    pages: 1
  };
};

// Função para dividir o texto em chunks de tamanho apropriado
const createTextChunks = (text: string, chunkSize: number = 500): string[] => {
  const chunks: string[] = [];
  
  // Na prática, usaríamos um método mais sofisticado que respeite limites de parágrafos
  // e sentenças. Esta é uma implementação simplificada
  const sentences = text.split(/(?<=\.)\s+/);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

export async function indexDocument(
  projectId: string,
  file: File
): Promise<IndexingResult> {
  try {
    // 1. Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `${projectId}/${fileName}`;
    
    // Upload to project_documents bucket
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('project_documents')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        message: `Erro ao fazer upload: ${uploadError.message}`,
      };
    }
    
    // 2. Get public URL for the uploaded file
    const { data: urlData } = await supabase
      .storage
      .from('project_documents')
      .getPublicUrl(filePath);
    
    const fileUrl = urlData.publicUrl;
    
    // 3. Store file reference in indexed_files table
    const { data: fileRecord, error: fileError } = await supabase
      .from('indexed_files')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        file_url: fileUrl,
        file_size: file.size,
        status: 'processing' // Iniciando o processamento
      })
      .select()
      .single();
    
    if (fileError) {
      console.error('Database error:', fileError);
      return {
        success: false,
        message: `Erro ao registrar arquivo: ${fileError.message}`,
      };
    }
    
    // 4. Extract text from file (async)
    try {
      // Em produção, isso seria feito em uma função de fundo ou edge function
      const { text, pages } = await extractTextFromFile(file);
      
      // 5. Split text into chunks
      const chunks = createTextChunks(text);
      
      // 6. Generate embeddings for each chunk and store in pgvector
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        // Calcular embedding (em produção, usaria API da OpenAI ou similar)
        const embedding = await generateEmbedding(chunk);
        
        // Determinar em qual página aproximadamente este chunk está
        // (distribuição uniforme para fins de exemplo)
        const estimatedPage = Math.floor((i / chunks.length) * pages) + 1;
        
        // Store the chunk and its embedding
        const { error: chunkError } = await supabase
          .from('document_chunks')
          .insert({
            project_id: projectId,
            file_id: fileRecord.id,
            chunk_index: i,
            content: chunk,
            metadata: {
              source: file.name,
              page: estimatedPage,
              chunk: i + 1,
              total_chunks: chunks.length
            },
            embedding: embedding
          });

        if (chunkError) {
          console.warn(`Warning: Error storing chunk: ${chunkError.message}`);
        }
      }
      
      // 7. Update file status to indexed
      await supabase
        .from('indexed_files')
        .update({ status: 'indexed' })
        .eq('id', fileRecord.id);
      
    } catch (processingError: any) {
      console.error('Error processing file:', processingError);
      
      // Update file with error status
      await supabase
        .from('indexed_files')
        .update({ 
          status: 'error',
          error_message: processingError.message || 'Erro no processamento do arquivo'
        })
        .eq('id', fileRecord.id);
    }
    
    return {
      success: true,
      documentId: fileRecord.id,
      message: 'Documento carregado e indexação iniciada',
      file: {
        id: fileRecord.id,
        name: file.name,
        type: file.type,
        url: fileUrl
      }
    };
  } catch (error: any) {
    console.error('Indexing document error:', error);
    return {
      success: false,
      message: `Erro inesperado: ${error.message}`,
    };
  }
}
