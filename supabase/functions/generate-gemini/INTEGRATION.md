# Frontend Integration Guide

## Overview

This guide shows how to integrate the Gemini Edge Function into the frontend application.

## Step-by-Step Integration

### 1. Update AI Context (Recommended Approach)

**File**: `src/contexts/AIContext.tsx`

Add Gemini as the primary provider with OpenRouter fallback:

```typescript
const generateWithGemini = async (
  projectId: string,
  section: string,
  charLimit: number
): Promise<GenerationResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-gemini', {
      body: {
        projectId,
        section,
        charLimit,
        model: 'gemini-2.0-flash-exp'
      }
    });

    if (error) throw error;

    return {
      success: true,
      text: data.text,
      sources: data.sources || [],
      provider: 'gemini',
      model: data.model
    };
  } catch (error) {
    console.error('Gemini generation failed:', error);
    throw error;
  }
};

const generateWithOpenRouter = async (
  projectId: string,
  section: string,
  charLimit: number
): Promise<GenerationResult> => {
  // Existing OpenRouter implementation
  const { data, error } = await supabase.functions.invoke('generate-openrouter', {
    body: { projectId, section, charLimit }
  });

  if (error) throw error;
  return { ...data, provider: 'openrouter' };
};

// Main generation function with fallback
const generateSection = async (
  projectId: string,
  section: string,
  charLimit: number = 2000,
  preferredProvider: 'gemini' | 'openrouter' = 'gemini'
): Promise<GenerationResult> => {
  try {
    if (preferredProvider === 'gemini') {
      // Try Gemini first
      try {
        return await generateWithGemini(projectId, section, charLimit);
      } catch (geminiError) {
        console.warn('Gemini failed, falling back to OpenRouter:', geminiError);
        return await generateWithOpenRouter(projectId, section, charLimit);
      }
    } else {
      return await generateWithOpenRouter(projectId, section, charLimit);
    }
  } catch (error) {
    throw new Error(`Falha na geração: ${error.message}`);
  }
};
```

### 2. Add Provider Selection (Optional)

Allow users to choose provider:

```typescript
// In your component
const [provider, setProvider] = useState<'gemini' | 'openrouter'>('gemini');

<Select value={provider} onValueChange={setProvider}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="gemini">
      Gemini 2.0 Flash (Rápido, Económico)
    </SelectItem>
    <SelectItem value="openrouter">
      OpenRouter (Fallback)
    </SelectItem>
  </SelectContent>
</Select>
```

### 3. Smart Routing Logic

Route sections automatically based on complexity:

```typescript
const getOptimalProvider = (sectionKey: string): 'gemini' | 'openrouter' => {
  // Complex sections that benefit from Claude/GPT-4
  const complexSections = [
    'analise_economico_financeira',
    'plano_investimentos',
    'analise_riscos'
  ];

  // Use OpenRouter for complex sections
  if (complexSections.includes(sectionKey)) {
    return 'openrouter';
  }

  // Use Gemini for most sections (70%)
  return 'gemini';
};

// Use in generation
const provider = getOptimalProvider(section);
const result = await generateSection(projectId, section, charLimit, provider);
```

### 4. Update Generation Hook

**File**: `src/hooks/useGeneration.ts` (if exists)

```typescript
export const useGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    projectId: string,
    section: string,
    options: {
      charLimit?: number;
      provider?: 'gemini' | 'openrouter' | 'auto';
      model?: string;
    } = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const {
        charLimit = 2000,
        provider = 'auto',
        model
      } = options;

      // Auto-select provider based on section
      const selectedProvider = provider === 'auto'
        ? getOptimalProvider(section)
        : provider;

      const result = await generateSection(
        projectId,
        section,
        charLimit,
        selectedProvider
      );

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
};
```

### 5. Add Analytics Tracking

Track provider usage and performance:

```typescript
const trackGeneration = async (result: GenerationResult) => {
  // Track in analytics (e.g., Sentry, PostHog)
  analytics.track('ai_generation', {
    provider: result.provider,
    model: result.model,
    chars_used: result.charsUsed,
    chunks_used: result.chunksUsed,
    section: result.section,
    success: result.success
  });
};

// After generation
const result = await generateSection(...);
await trackGeneration(result);
```

### 6. Error Handling and User Feedback

```typescript
const handleGeneration = async () => {
  try {
    setGenerating(true);

    const result = await generateSection(
      projectId,
      section,
      charLimit,
      'gemini'
    );

    if (result.success) {
      toast({
        title: "Conteúdo gerado com sucesso",
        description: `${result.charsUsed} caracteres gerados usando ${result.provider}`,
      });

      // Update section content
      updateSectionContent(result.text);

      // Show sources if available
      if (result.sources?.length > 0) {
        showSourcesDialog(result.sources);
      }
    }
  } catch (error) {
    toast({
      title: "Erro na geração",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setGenerating(false);
  }
};
```

## A/B Testing Setup

### 1. Implement A/B Test

```typescript
const getProviderForABTest = (userId: string): 'gemini' | 'openrouter' => {
  // Simple hash-based assignment (50/50 split)
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 2 === 0 ? 'gemini' : 'openrouter';
};

// Or use feature flags
const provider = featureFlags.enabled('gemini-70-percent')
  ? 'gemini'
  : 'openrouter';
```

### 2. Track Metrics

```typescript
interface GenerationMetrics {
  provider: string;
  model: string;
  responseTime: number;
  charsUsed: number;
  chunksUsed: number;
  userSatisfaction?: number; // 1-5 rating
  edited: boolean; // Did user edit the result?
}

const trackMetrics = async (metrics: GenerationMetrics) => {
  await supabase.from('generation_metrics').insert({
    ...metrics,
    timestamp: new Date().toISOString()
  });
};
```

## Migration Checklist

### Week 1: Gradual Rollout

- [ ] Deploy Gemini edge function
- [ ] Set `GOOGLE_AI_API_KEY` in Supabase
- [ ] Update AI context with Gemini support
- [ ] Enable Gemini for 5% of users (feature flag)
- [ ] Monitor error rates and performance
- [ ] Collect user feedback

### Week 2: Expand to 70%

- [ ] Increase Gemini usage to 30%
- [ ] Verify cost savings (should see ~50% reduction)
- [ ] Check quality metrics (user edits, satisfaction)
- [ ] Expand to 70% if metrics are positive
- [ ] Keep OpenRouter for complex sections

### Week 3: Claude 3.7 Sonnet

- [ ] Create `generate-claude` edge function
- [ ] Route 20% of traffic to Claude for quality comparison
- [ ] Final split: 70% Gemini, 20% Claude, 10% OpenRouter

## Environment-Specific Configuration

### Development

```typescript
const getProvider = () => {
  if (import.meta.env.DEV) {
    return 'gemini'; // Test Gemini in dev
  }
  return getOptimalProvider(section);
};
```

### Production

```typescript
const getProvider = () => {
  // Check if Gemini is healthy
  const geminiHealthy = checkProviderHealth('gemini');

  if (!geminiHealthy) {
    console.warn('Gemini unhealthy, using OpenRouter');
    return 'openrouter';
  }

  return getOptimalProvider(section);
};
```

## Cost Tracking Dashboard

Add a cost tracking component:

```typescript
const CostTracker = () => {
  const [costs, setCosts] = useState({
    gemini: 0,
    openrouter: 0,
    savings: 0
  });

  useEffect(() => {
    const fetchCosts = async () => {
      const { data } = await supabase
        .from('generations')
        .select('provider, model, chars_used, created_at')
        .gte('created_at', startOfMonth);

      const calculated = calculateCosts(data);
      setCosts(calculated);
    };

    fetchCosts();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custos de Geração IA</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>Gemini: ${costs.gemini.toFixed(2)}</div>
          <div>OpenRouter: ${costs.openrouter.toFixed(2)}</div>
          <div className="text-green-600">
            Poupança: ${costs.savings.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Gemini Integration', () => {
  it('should call Gemini function with correct parameters', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { success: true, text: 'Generated text', provider: 'gemini' }
    });

    global.supabase = { functions: { invoke } };

    await generateWithGemini('project-id', 'introducao', 2000);

    expect(invoke).toHaveBeenCalledWith('generate-gemini', {
      body: {
        projectId: 'project-id',
        section: 'introducao',
        charLimit: 2000,
        model: 'gemini-2.0-flash-exp'
      }
    });
  });

  it('should fallback to OpenRouter on Gemini error', async () => {
    const generateWithGemini = vi.fn().mockRejectedValue(new Error('Gemini error'));
    const generateWithOpenRouter = vi.fn().mockResolvedValue({ success: true });

    await generateSection('project-id', 'introducao', 2000, 'gemini');

    expect(generateWithOpenRouter).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
describe('End-to-end Generation', () => {
  it('should generate content with Gemini', async () => {
    const result = await generateSection(
      testProjectId,
      'introducao',
      2000,
      'gemini'
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBe('gemini');
    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeLessThanOrEqual(2000);
  });
});
```

## Monitoring

### Sentry Setup

```typescript
Sentry.init({
  beforeSend(event, hint) {
    // Add provider context
    if (event.contexts) {
      event.contexts.ai = {
        provider: currentProvider,
        model: currentModel
      };
    }
    return event;
  }
});
```

### Performance Monitoring

```typescript
const measureGenerationTime = async (fn: () => Promise<any>) => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  // Log to analytics
  analytics.track('generation_performance', {
    provider: result.provider,
    duration_ms: duration
  });

  return result;
};
```

## Support

If you encounter issues:

1. Check edge function logs: `supabase functions logs generate-gemini`
2. Verify API key is set: `supabase secrets list`
3. Test directly: `curl` command in README.md
4. Review Sentry for error patterns
5. Check rate limits (15 RPM for free tier)
