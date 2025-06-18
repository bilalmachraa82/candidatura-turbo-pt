
# Sistema PT2030 - Documentação Técnica

## Arquitetura Atual (100% OpenRouter)

### 1. Stack Tecnológico
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **IA**: OpenRouter API (acesso a todos os modelos)
- **Storage**: Supabase Storage para documentos
- **Vector DB**: Supabase pgvector para RAG

### 2. Fluxo de Funcionamento

#### A. Upload e Indexação de Documentos
1. Utilizador faz upload de PDF/Excel via interface
2. Documento é guardado no Supabase Storage
3. Edge Function `index-document` extrai texto
4. Texto é dividido em chunks (1000 caracteres com overlap de 200)
5. OpenRouter gera embeddings para cada chunk
6. Embeddings são guardados na tabela `document_chunks` com pgvector

#### B. Geração de Conteúdo com IA
1. Utilizador seleciona secção da candidatura
2. Sistema faz pesquisa vetorial nos documentos do projeto
3. Edge Function `generate-openrouter` prepara contexto relevante
4. OpenRouter gera texto baseado em:
   - Contexto dos documentos indexados
   - Prompt específico da secção PT2030
   - Limite de caracteres definido
5. Texto gerado é apresentado ao utilizador para refinamento

#### C. Sistema de Chat Inteligente
1. Chat específico por secção com histórico
2. Utilizador pode refinar o conteúdo iterativamente
3. IA mantém contexto da conversa e documentos

### 3. Modelos IA Disponíveis (OpenRouter)

#### Recomendados para PT2030:
- **Gemini 2.0 Flash**: Rápido, eficiente, boa relação qualidade/preço
- **Gemini 2.5 Pro**: Análises técnicas complexas
- **Claude 3.5 Sonnet**: Texto técnico e jurídico
- **GPT-4o**: Versátil para todas as secções

#### Especializações por Secção:
- **Análise de Mercado**: Gemini 2.5 Pro
- **Proposta de Valor**: Claude 3.5 Sonnet  
- **Plano Financeiro**: GPT-4o
- **Estratégia Comercial**: Gemini 2.0 Flash

### 4. Funcionalidades Implementadas ✅

- ✅ Sistema completo de upload e indexação
- ✅ Geração de texto com RAG (Retrieval Augmented Generation)
- ✅ Editor de secções com auto-save
- ✅ Seletor de modelos IA
- ✅ Chat inteligente por secção
- ✅ Pesquisa vetorial em documentos
- ✅ Interface responsiva e moderna
- ✅ Autenticação e gestão de utilizadores
- ✅ Sistema de projetos

### 5. Próximas Implementações 🚧

#### FASE 1 - Storage e Upload Melhorado
- [ ] Criar bucket Supabase Storage "project-documents"
- [ ] Melhorar sistema de categorização de documentos
- [ ] Preview de documentos na interface

#### FASE 2 - Prompts Especializados
- [ ] Templates específicos por secção PT2030
- [ ] Sistema de prompts personalizáveis
- [ ] Integração com PDFs de regulamentação oficial

#### FASE 3 - Workflow Avançado
- [ ] Sistema de comentários e aprovação
- [ ] Verificação de consistência entre secções
- [ ] Dashboard de progresso da candidatura

#### FASE 4 - Exportação e Finalização
- [ ] Exportação para formato oficial PT2030
- [ ] Geração automática de anexos
- [ ] Sistema de métricas e otimização

### 6. Configuração Necessária

#### Variáveis de Ambiente:
```
VITE_SUPABASE_URL=https://sapyhkbmrscensguyzbt.supabase.co
VITE_SUPABASE_ANON_KEY=[sua_chave]
OPENROUTER_API_KEY=[já_configurado]
```

#### Base de Dados Supabase:
- ✅ Tabela `projects` - Projetos de candidatura
- ✅ Tabela `sections` - Secções da candidatura
- ✅ Tabela `document_chunks` - Chunks indexados com embeddings
- ✅ Tabela `indexed_files` - Ficheiros carregados
- ✅ Tabela `generations` - Histórico de gerações

### 7. Para Próximos Passos

1. **Upload dos PDFs especializados**: Regras PT2030 + Estratégia da empresa
2. **Criação de prompts específicos** por cada secção
3. **Calibração da IA** com base de conhecimento especializada
4. **Sistema de refinamento** com chat avançado
5. **Workflow completo** de candidatura

O sistema está preparado para ser 100% operacional com estas melhorias!
