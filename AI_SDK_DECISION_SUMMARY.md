# AI SDK Decision Summary
## Quick Reference for PT2030 Candidaturas

---

## ⭐ RECOMMENDATION: Mix Strategy (Gemini + Claude Direct)

### Cost Comparison (Monthly)

| Strategy | Cost | Savings | Notes |
|----------|------|---------|-------|
| **Current (OpenRouter)** | $137 | Baseline | Using mix of models |
| **Recommended (Mix Direct)** | **$90** | **-34%** | Best value |
| Gemini Only | $12 | -91% | Budget option |
| Claude Only | $273 | +99% | Premium option |

**Annual Savings: $563/year**

---

## Implementation Plan

### Week 1: Deploy Gemini
```bash
# 1. Get API key
Visit: https://aistudio.google.com/app/apikey

# 2. Set secret
supabase secrets set GOOGLE_AI_API_KEY=AIza...

# 3. Deploy
supabase functions deploy generate-gemini

# 4. Test
Route 70% of requests to Gemini
```

### Week 2: Add Claude
```bash
# 1. Get API key
Visit: https://console.anthropic.com/settings/keys

# 2. Set secret
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 3. Deploy
supabase functions deploy generate-claude

# 4. Test
Route 30% critical sections to Claude
```

### Week 3-4: Optimize & Monitor
- Check cache hit rates (Claude)
- Monitor costs in Supabase dashboard
- Fine-tune model routing
- Remove OpenRouter fallback

---

## Model Routing Rules

### Use Claude 3.5 Sonnet (30%) for:
- ✅ Objetivos
- ✅ Impacto
- ✅ Resultados Esperados
- ✅ Sustentabilidade
- ✅ Inovação
- ✅ Justificação

**Why:** Best Portuguese quality, prompt caching saves 90%

### Use Gemini 2.0 Flash (70%) for:
- ✅ Descrição Breve
- ✅ Equipa
- ✅ Metodologia
- ✅ Cronograma
- ✅ Orçamento
- ✅ Localização

**Why:** Fast, cheap, good quality

---

## Key Features by Provider

### Gemini 2.0 Flash ⚡
- **Cost:** $0.10 input / $0.40 output per 1M tokens
- **Free Tier:** 25 requests/day
- **Context:** 1M tokens
- **Caching:** FREE (automatic)
- **Speed:** <1s avg
- **Portuguese:** ⭐⭐⭐⭐ (4/5)

### Claude 3.5 Sonnet 🏆
- **Cost:** $3 input / $15 output per 1M tokens
- **Caching:** $0.30 per 1M cache reads (90% savings!)
- **Context:** 200k tokens
- **Speed:** <2s avg
- **Portuguese:** ⭐⭐⭐⭐⭐ (5/5 - BEST)

---

## Expected Results

### Usage (30,000 generations/month)

**Gemini Portion (21,000):**
- Input: 42M tokens × $0.10 = $4.20
- Output: 10.5M tokens × $0.40 = $4.20
- **Subtotal: $8.40**

**Claude Portion (9,000 with caching):**
- Cache writes: $6.75
- Cache reads: $4.86
- Non-cached: $2.70
- Output: $67.50
- **Subtotal: $81.81**

**TOTAL: $90.21/month**

---

## Key Metrics to Track

### Week 1
- [ ] Gemini generation success rate
- [ ] Average latency
- [ ] User satisfaction
- [ ] Cost per generation

### Week 2
- [ ] Claude cache hit rate (target: >80%)
- [ ] Quality comparison
- [ ] Total spend
- [ ] Error rates

### Month 1
- [ ] Total cost vs projection
- [ ] Model distribution (actual vs plan)
- [ ] User feedback
- [ ] Performance benchmarks

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API downtime | Keep OpenRouter as fallback (1 month) |
| Cost overruns | Set budget alerts in Supabase |
| Quality issues | A/B test before full rollout |
| Rate limits | Use paid tier if free tier insufficient |

---

## Files Created

1. **AI_SDK_RESEARCH_REPORT.md** - Full analysis (40 pages)
2. **MIGRATION_TEMPLATES.md** - Copy-paste code (20 pages)
3. **AI_SDK_DECISION_SUMMARY.md** - This file (quick ref)

---

## Action Items

### Today
- [ ] Read AI_SDK_RESEARCH_REPORT.md (sections 1-3)
- [ ] Create Google AI account
- [ ] Create Anthropic account
- [ ] Generate API keys

### This Week
- [ ] Copy code from MIGRATION_TEMPLATES.md
- [ ] Deploy generate-gemini function
- [ ] Test in development
- [ ] Deploy to staging

### Next Week
- [ ] Deploy generate-claude function
- [ ] Enable prompt caching
- [ ] Monitor performance
- [ ] Gradual production rollout

---

## Quick Links

- [Google AI Studio](https://aistudio.google.com/)
- [Anthropic Console](https://console.anthropic.com/)
- [Gemini Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Claude Pricing](https://docs.claude.com/en/docs/about-claude/pricing)
- [Prompt Caching Guide](https://www.anthropic.com/news/prompt-caching)

---

## Questions?

**Cost concerns?**
→ Start with Gemini only ($12/month) then add Claude later

**Quality concerns?**
→ Use Claude for all critical sections (still saves vs OpenRouter)

**Migration complexity?**
→ Templates provided, ~2-3 days effort, gradual rollout

**Want to keep flexibility?**
→ Consider Vercel AI SDK (same cost, better DX)

---

## Bottom Line

✅ **DO THIS:** Deploy mix strategy (Gemini + Claude)
✅ **SAVE:** 34% ($47/month, $563/year)
✅ **WIN:** Better quality, better performance, better control
✅ **EFFORT:** 2-3 days initial, low maintenance

**Expected ROI:** Break-even in <1 week of developer time

---

**Decision:** ✅ APPROVED / ⏸️ PENDING / ❌ REJECTED

**Timeline:** Start Week of: __________

**Owner:** __________

---

Last Updated: January 2025
