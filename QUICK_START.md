# Quick Start: Claude SDK with Prompt Caching

## 🚀 5-Minute Deployment

### 1. Set API Key
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Apply Database Migration
```bash
supabase db push
```

### 3. Deploy Function
```bash
cd supabase/functions/generate-claude
./deploy.sh
```

### 4. Test
```bash
./test.sh
```

## ✅ That's it!

Your system now uses intelligent AI routing:
- **Claude 3.5 Sonnet**: Critical sections (innovation, criteria) with 90% cache savings
- **Gemini 2.0 Flash**: Fast sections (market analysis, procedures)
- **OpenRouter**: Fallback

## 📊 Expected Results

- Response time: 8-12s for Claude, 3-5s for Gemini
- Cache hit rate: 75-85% after first request
- Cost: ~$0.007 per project (10 sections)
- Quality: Professional PT-PT on critical sections

## 🔍 Monitor

```bash
# Real-time logs
supabase functions logs generate-claude --tail

# Check costs
psql> SELECT * FROM generation_cost_analytics;

# Cache savings
psql> SELECT * FROM calculate_cache_savings();
```

## 📚 Full Documentation

- **API Reference**: `/supabase/functions/generate-claude/README.md`
- **Caching Guide**: `/supabase/functions/generate-claude/PROMPT_CACHING.md`
- **Deployment Guide**: `/CLAUDE_DEPLOYMENT_GUIDE.md`

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Missing API key | `supabase secrets set ANTHROPIC_API_KEY=...` |
| Function fails | Check logs: `supabase functions logs generate-claude` |
| Low cache rate | Batch requests within 5 minutes |
| High costs | Review `charLimit` settings, check routing |

## 💰 Cost Savings Example

**Traditional approach** (no caching):
- 10 sections × $0.006 = $0.06

**With prompt caching**:
- 1st request: $0.006 (creates cache)
- 9 cached requests: $0.0012 × 9 = $0.0108
- **Total: $0.0168 = 72% savings**

**With intelligent routing** (Claude only for critical 30%):
- 3 Claude sections × $0.0012 = $0.0036
- 6 Gemini sections × $0.0006 = $0.0036
- 1 OpenRouter (free) = $0.00
- **Total: $0.0072 = 88% savings**

---

**Questions?** Check the full deployment guide or function logs.
