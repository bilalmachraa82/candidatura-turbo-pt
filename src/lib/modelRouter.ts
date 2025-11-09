/**
 * Model Router
 *
 * Intelligently routes AI generation requests to the optimal provider based on section requirements.
 *
 * Strategy:
 * - Claude 3.5 Sonnet (30%): High-quality critical sections (innovation, fundamentation, selection criteria)
 * - Gemini 2.0 Flash (60%): Fast generation for straightforward content (market analysis, procedures)
 * - OpenRouter (10%): Fallback for other sections
 *
 * Cost Optimization:
 * - Claude with prompt caching: ~$0.0012 per request (with 80% cache hit rate)
 * - Gemini 2.0 Flash: ~$0.0006 per request
 * - OpenRouter (free tier): $0.00 per request
 *
 * Quality vs Speed:
 * - Claude: Highest quality, best for Portuguese, moderate speed
 * - Gemini: Good quality, very fast, cost-effective
 * - OpenRouter: Variable quality, fallback option
 */

export type AIProvider = 'claude' | 'gemini' | 'openrouter';

export interface ModelSelection {
  provider: AIProvider;
  model: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Sections that require Claude 3.5 Sonnet (30% - highest quality)
 * These are critical sections where quality and accuracy are paramount
 */
const CLAUDE_SECTIONS = [
  '9.designacao',           // Project designation - first impression
  '12.i',                   // Innovation - core differentiator
  '19.fundamentacao',       // EREI fundamentation - complex justification
  '20.B1',                  // Selection criteria: Innovation
  '20.C1',                  // Selection criteria: Competitiveness
  '20.D12',                 // Selection criteria: Sustainability
  '20.D13',                 // Selection criteria: Digital transition
  '20.D2',                  // Selection criteria: Carbon neutrality
  '20.A1',                  // Selection criteria: Strategic relevance
  '11.fundamentacao',       // Investment fundamentation
];

/**
 * Sections that can use Gemini 2.0 Flash (60% - speed optimized)
 * These sections benefit from fast generation and are more straightforward
 */
const GEMINI_SECTIONS = [
  '4.i',                    // Market analysis: National
  '4.ii',                   // Market analysis: International
  '4.iii',                  // Market analysis: Target segments
  '4.iv',                   // Market analysis: Competition
  '6.fundamentacao',        // Export sales justification
  '7.fundamentacao',        // Import substitution justification
  '13.i',                   // Procurement procedures
  '13.ii',                  // Supplier selection
  '13.iii',                 // Contract management
  '14.fundamentacao',       // Project calendar justification
  '15.fundamentacao',       // Human resources justification
  '16.fundamentacao',       // Budget justification
  '17.fundamentacao',       // Financing plan justification
  '18.fundamentacao',       // Economic-financial indicators
];

/**
 * Get the optimal AI model and provider for a given section
 *
 * @param sectionKey - The section identifier (e.g., '9.designacao', '12.i')
 * @returns ModelSelection with provider, model, and rationale
 */
export function getOptimalModel(sectionKey: string): ModelSelection {
  // Priority 1: Claude for critical high-quality sections
  if (CLAUDE_SECTIONS.includes(sectionKey)) {
    return {
      provider: 'claude',
      model: 'claude-3-5-sonnet-20241022',
      rationale: 'Critical section requiring highest quality and accuracy. Claude 3.5 Sonnet excels at Portuguese and complex reasoning.',
      priority: 'high'
    };
  }

  // Priority 2: Gemini for fast, cost-effective generation
  if (GEMINI_SECTIONS.includes(sectionKey)) {
    return {
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      rationale: 'Straightforward content that benefits from fast generation. Gemini 2.0 Flash provides excellent speed-to-quality ratio.',
      priority: 'medium'
    };
  }

  // Priority 3: OpenRouter as fallback (free tier)
  return {
    provider: 'openrouter',
    model: 'google/gemini-2.0-flash-exp:free',
    rationale: 'General section using free tier. OpenRouter provides cost-effective generation for standard content.',
    priority: 'low'
  };
}

/**
 * Get provider-specific configuration
 */
export function getProviderConfig(provider: AIProvider): {
  edgeFunction: string;
  displayName: string;
  supportsStreaming: boolean;
  avgResponseTime: string;
} {
  switch (provider) {
    case 'claude':
      return {
        edgeFunction: 'generate-claude',
        displayName: 'Anthropic Claude',
        supportsStreaming: false,
        avgResponseTime: '8-12s'
      };
    case 'gemini':
      return {
        edgeFunction: 'generate-gemini',
        displayName: 'Google Gemini',
        supportsStreaming: false,
        avgResponseTime: '3-5s'
      };
    case 'openrouter':
      return {
        edgeFunction: 'generate-openrouter',
        displayName: 'OpenRouter',
        supportsStreaming: false,
        avgResponseTime: '5-8s'
      };
  }
}

/**
 * Get cost estimate for a section generation
 */
export function estimateCost(
  sectionKey: string,
  charLimit: number
): {
  provider: AIProvider;
  estimatedCost: number;
  costBreakdown: string;
} {
  const selection = getOptimalModel(sectionKey);
  const estimatedTokens = Math.ceil(charLimit * 1.5); // Rough token estimate

  let estimatedCost = 0;
  let costBreakdown = '';

  switch (selection.provider) {
    case 'claude':
      // With 80% cache hit rate after first request
      const inputCost = (estimatedTokens * 0.2 * 3.00) / 1_000_000; // 20% new tokens
      const cachedCost = (estimatedTokens * 0.8 * 0.30) / 1_000_000; // 80% cached
      const outputCost = (estimatedTokens * 15.00) / 1_000_000;
      estimatedCost = inputCost + cachedCost + outputCost;
      costBreakdown = `Input: $${inputCost.toFixed(6)}, Cached: $${cachedCost.toFixed(6)}, Output: $${outputCost.toFixed(6)}`;
      break;

    case 'gemini':
      const geminiInputCost = (estimatedTokens * 0.10) / 1_000_000;
      const geminiOutputCost = (estimatedTokens * 0.40) / 1_000_000;
      estimatedCost = geminiInputCost + geminiOutputCost;
      costBreakdown = `Input: $${geminiInputCost.toFixed(6)}, Output: $${geminiOutputCost.toFixed(6)}`;
      break;

    case 'openrouter':
      estimatedCost = 0; // Free tier
      costBreakdown = 'Free tier (subject to rate limits)';
      break;
  }

  return {
    provider: selection.provider,
    estimatedCost,
    costBreakdown
  };
}

/**
 * Get model routing statistics
 */
export function getRoutingStats(): {
  totalSections: number;
  claudeSections: number;
  geminiSections: number;
  openrouterSections: number;
  distribution: {
    claude: string;
    gemini: string;
    openrouter: string;
  };
} {
  const totalSections = CLAUDE_SECTIONS.length + GEMINI_SECTIONS.length;

  return {
    totalSections: totalSections,
    claudeSections: CLAUDE_SECTIONS.length,
    geminiSections: GEMINI_SECTIONS.length,
    openrouterSections: 0, // Calculated dynamically based on actual sections
    distribution: {
      claude: `${((CLAUDE_SECTIONS.length / totalSections) * 100).toFixed(1)}%`,
      gemini: `${((GEMINI_SECTIONS.length / totalSections) * 100).toFixed(1)}%`,
      openrouter: 'Fallback'
    }
  };
}
