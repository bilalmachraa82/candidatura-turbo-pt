# Quick Start Guide - Gemini Edge Function

## 🎯 Goal

Replace 70% of OpenRouter calls with Google Gemini 2.0 Flash to reduce costs by ~70% while maintaining quality.

## ⚡ 5-Minute Setup

### Step 1: Get Google AI API Key

1. Visit https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### Step 2: Configure Supabase Secrets

```bash
# Set the API key
supabase secrets set GOOGLE_AI_API_KEY=AIza...

# Verify it's set
supabase secrets list
```

### Step 3: Deploy the Function

```bash
# Option A: Use the deploy script
cd supabase/functions/generate-gemini
./deploy.sh

# Option B: Manual deployment
supabase functions deploy generate-gemini
```

### Step 4: Test the Function

```bash
# Quick test
supabase functions invoke generate-gemini --body '{
  "projectId": "your-project-id",
  "section": "introducao",
  "charLimit": 2000
}'

# Expected response:
# {
#   "success": true,
#   "text": "Generated content...",
#   "charsUsed": 1234,
#   "model": "gemini-2.0-flash-exp",
#   "provider": "gemini",
#   "sources": [...],
#   "chunksUsed": 5
# }
```

### Step 5: Integrate in Frontend

See `INTEGRATION.md` for complete integration guide.

**Quick integration** (add to your AI context):

```typescript
const { data, error } = await supabase.functions.invoke('generate-gemini', {
  body: {
    projectId: 'project-uuid',
    section: 'introducao',
    charLimit: 2000
  }
});

if (data?.success) {
  updateSectionContent(data.text);
}
```

## 📊 Migration Plan

### Week 1: Soft Launch (5% traffic)

```typescript
// Route 5% of traffic to Gemini
const useGemini = Math.random() < 0.05;
const provider = useGemini ? 'gemini' : 'openrouter';
```

**Monitor:**
- Error rates (should be < 2%)
- Response times (should be 1-3s)
- User feedback
- Cost per generation

### Week 2: Ramp Up (70% traffic)

```typescript
// Route based on section complexity
const complexSections = [
  'analise_economico_financeira',
  'plano_investimentos'
];

const provider = complexSections.includes(section)
  ? 'openrouter'
  : 'gemini'; // 70% of sections
```

**Target metrics:**
- 70% cost reduction
- 95%+ quality score
- < 3s response time
- < 1% error rate

### Week 3: Add Claude 3.7 Sonnet

```typescript
// Final split: 70% Gemini, 20% Claude, 10% OpenRouter
const getProvider = (section) => {
  if (complexSections.includes(section)) return 'claude';
  if (criticalSections.includes(section)) return 'openrouter';
  return 'gemini';
};
```

## 🔍 Monitoring

### Check Logs

```bash
# Real-time logs
supabase functions logs generate-gemini --follow

# Recent errors
supabase functions logs generate-gemini --level error --limit 50

# Filter by project
supabase functions logs generate-gemini | grep "projectId: abc-123"
```

### Dashboard Queries

```sql
-- Generation stats by provider (last 24h)
SELECT
  provider,
  model,
  COUNT(*) as total_generations,
  AVG(chars_used) as avg_chars,
  AVG(chunks_used) as avg_chunks
FROM generations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY provider, model
ORDER BY total_generations DESC;

-- Error rate
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed,
  ROUND(
    COUNT(*) FILTER (WHERE success = false)::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as error_rate_pct
FROM generations
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Cost estimation
SELECT
  provider,
  SUM(
    CASE
      WHEN provider = 'gemini' THEN
        (chars_used * 4 * 0.10 / 1000000) + -- input tokens
        (chars_used * 0.40 / 1000000)        -- output tokens
      WHEN provider = 'openrouter' THEN
        (chars_used * 4 * 0.15 / 1000000) +
        (chars_used * 0.60 / 1000000)
      ELSE 0
    END
  )::numeric(10,4) as estimated_cost_usd
FROM generations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY provider;
```

## 🚨 Troubleshooting

### Issue: "GOOGLE_AI_API_KEY não configurada"

**Solution:**
```bash
supabase secrets set GOOGLE_AI_API_KEY=AIza...
```

### Issue: Rate limit exceeded (429)

**Cause:** Free tier limit is 15 RPM

**Solutions:**
1. Add request queuing in frontend
2. Implement exponential backoff
3. Upgrade to paid tier
4. Fallback to OpenRouter

```typescript
const generateWithRetry = async (params, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generate(params);
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
};
```

### Issue: Poor quality generations

**Solutions:**
1. Check if RAG is working (`chunksUsed > 0`)
2. Upload better quality documents
3. Use more specific prompts
4. Switch to `gemini-1.5-pro` for complex sections

### Issue: Empty or truncated responses

**Check:**
1. Character limit is reasonable (500-4000)
2. Section data exists in database
3. Model has sufficient token limit
4. Response isn't being cut off by frontend

## 💰 Cost Comparison

**Current costs (100% OpenRouter):**
- Average: $0.003 per generation
- Monthly (10k generations): $30

**After migration (70% Gemini, 30% OpenRouter):**
- Gemini: $0.001 per generation
- OpenRouter: $0.003 per generation
- Monthly (10k generations): $7 + $9 = **$16**
- **Savings: $14/month (47%)**

**With free tier:**
- Gemini: FREE for first 1M tokens/day (~5000 generations)
- Potential savings: **90%+**

## 📈 Success Metrics

Track these KPIs:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Cost per generation | < $0.001 | - | ⬜ |
| Response time | < 3s | - | ⬜ |
| Error rate | < 1% | - | ⬜ |
| User satisfaction | > 4.0/5 | - | ⬜ |
| RAG usage | > 80% | - | ⬜ |
| Quality score | > 95% | - | ⬜ |

## 🔄 Rollback Plan

If metrics are not met:

```bash
# Option 1: Reduce Gemini usage
const geminiPercentage = 0.20; // Reduce to 20%

# Option 2: Disable Gemini entirely
const provider = 'openrouter'; // Fallback to OpenRouter

# Option 3: Redeploy old version
git revert <commit-hash>
supabase functions deploy generate-gemini
```

## 📚 Additional Resources

- [README.md](./README.md) - Complete documentation
- [INTEGRATION.md](./INTEGRATION.md) - Frontend integration guide
- [Gemini API Docs](https://ai.google.dev/docs)
- [Supabase Functions](https://supabase.com/docs/guides/functions)

## ✅ Pre-Launch Checklist

- [ ] API key configured in Supabase
- [ ] Function deployed successfully
- [ ] Test passes with real project data
- [ ] Logs show no errors
- [ ] Frontend integration complete
- [ ] Fallback to OpenRouter works
- [ ] Monitoring dashboard set up
- [ ] Team notified of changes
- [ ] Rollback plan documented

## 🎉 Next Steps

1. ✅ Deploy Gemini function
2. ⬜ Test with 1-2 projects
3. ⬜ Enable for 5% of users
4. ⬜ Monitor for 48 hours
5. ⬜ Ramp up to 70% if successful
6. ⬜ Add Claude 3.7 Sonnet
7. ⬜ Celebrate cost savings! 🎊

---

**Questions?** Check logs, review documentation, or test locally.

**Issues?** Rollback to OpenRouter and investigate.

**Success?** Scale to 70% and enjoy the savings!
