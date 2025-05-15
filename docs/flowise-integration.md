
# Integração com Flowise API

Esta aplicação utiliza a Flowise API para geração de texto assistido por IA. A integração é feita através de uma API HTTP que é consumida pela aplicação.

## Configuração da API Flowise

Para configurar a integração com a Flowise API, você precisará:

1. **Ter um endpoint Flowise disponível**
   
   Você pode criar um em [Flowise Cloud](https://cloud.flowiseai.com/) ou hospedar sua própria instância do Flowise.

2. **Configurar o fluxo de trabalho no Flowise**

   O fluxo de trabalho deve aceitar os seguintes parâmetros:
   - `question`: A pergunta ou contexto para geração de texto
   - `context`: Texto relevante dos documentos indexados
   - `overrideConfig`: Configurações para sobreescrever o modelo padrão

   O fluxo deve retornar:
   - `text`: O texto gerado
   - `sources`: Array opcional de fontes utilizadas

3. **Obter sua API Key**

   Gere uma API Key no painel do Flowise.

4. **Configurar as variáveis de ambiente**

   Configure as seguintes variáveis em seu arquivo `.env.local`:
   ```
   VITE_FLOWISE_URL=sua_url_do_flowise
   VITE_FLOWISE_API_KEY=sua_chave_api_do_flowise
   ```

   Para o ambiente de produção no Railway, configure as mesmas variáveis.

## Implementação na Aplicação

A integração com a Flowise API é feita através do arquivo `src/api/generateText.ts`. Este arquivo contém a lógica para:

1. Buscar documentos relevantes do projeto no Supabase
2. Realizar uma chamada à API Flowise com o modelo selecionado
3. Retornar o texto gerado e as fontes utilizadas

## Suporte a Múltiplos Modelos

A aplicação suporta os seguintes modelos de IA:

- **GPT-4o**: Mais equilibrado e rápido
- **Gemini Pro**: Melhor para análises técnicas
- **Claude 3 Opus**: Ideal para textos complexos e análise detalhada

Para usar um modelo específico, selecione-o no componente `ModelSelector` na interface da aplicação.

## Solução de Problemas

### Erro de Conexão

Se você encontrar erros de conexão com a API Flowise:

1. Verifique se a URL e a API Key estão corretas
2. Confirme se a API está online e respondendo
3. Verifique os logs do Flowise para mais detalhes

### Problemas de Geração de Texto

Se a geração de texto não estiver funcionando como esperado:

1. Verifique se o seu fluxo está corretamente configurado
2. Confirme se o modelo selecionado está disponível em sua instância do Flowise
3. Verifique se há documentos indexados para o projeto em questão

## Recomendações para Produção

- Configure rate limits para evitar uso excessivo da API
- Monitore o uso da API para controle de custos
- Considere implementar cache para resultados frequentes
