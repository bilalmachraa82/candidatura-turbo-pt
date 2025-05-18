
// Esta é uma versão simplificada para POC que simula a geração de embeddings
// Em produção, usaria uma API como OpenAI, Cohere, ou similar

// Função para gerar um número aleatório gaussiano
function gaussianRandom(): number {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converter 0 para evitar log(0)
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Simula a geração de um embedding para um texto
// Em produção, usaria algo como openai.embeddings.create()
export async function generateEmbedding(text: string): Promise<number[]> {
  // Na versão de produção, chamaríamos uma API como:
  /*
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });
  
  const data = await response.json();
  return data.data[0].embedding;
  */
  
  // Para fins de POC, geramos um vetor aleatório com características semelhantes a embeddings reais
  
  // Criar um hash simples do texto para garantir alguma consistência
  // nos embeddings para o mesmo texto
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  
  // Usar o hash como seed para o gerador
  Math.seedrandom && Math.seedrandom(hash.toString());
  
  // Gerar um vetor de 1536 dimensões (padrão da OpenAI)
  const dimensions = 1536;
  const embedding = Array.from({ length: dimensions }, () => gaussianRandom() * 0.1);
  
  // Normalizar o vetor para ter norma unitária
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  const normalizedEmbedding = embedding.map(val => val / norm);
  
  return normalizedEmbedding;
}

// Adicionando a função seedrandom ao objeto Math para simular seed
declare global {
  interface Math {
    seedrandom?: (seed: string) => void;
  }
}

// Implementação simples de seedrandom
Math.seedrandom = function(seed: string): void {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s += seed.charCodeAt(i);
  }
  
  const oldRandom = Math.random;
  const mask = 0xffffffff;
  
  let m_w = (123456789 + s) & mask;
  let m_z = (987654321 - s) & mask;
  
  Math.random = function() {
    m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask;
    
    let result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  };
};
