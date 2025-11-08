# Quality Scoring System - Quick Reference

## 🚀 Quick Start

### 1. Deploy Edge Function
```bash
supabase functions deploy score-section
```

### 2. Run Migration
```bash
supabase db push
```

### 3. Use in Component
```typescript
import { useQualityScore } from '@/hooks/useQualityScore';
import { QualityPanel } from '@/components/quality';

const { score, isScoring, error, reScore } = useQualityScore({
  sectionId: section.id,
  content: text,
});

<QualityPanel score={score} isScoring={isScoring} error={error} onReScore={reScore} sectionId={section.id} />
```

## 📊 Score Ranges

| Score | Label | Color | Meaning |
|-------|-------|-------|---------|
| 85-100 | Excelente | 🟢 Green | Ready to submit |
| 70-84 | Bom | 🟡 Yellow | Minor improvements |
| 50-69 | Precisa Melhorar | 🟠 Orange | Needs work |
| 0-49 | Insuficiente | 🔴 Red | Major revisions needed |

## 🎯 Scoring Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Completeness** | 25% | Length, structure, coverage |
| **Specificity** | 25% | Numbers, data, examples |
| **Keywords** | 20% | PT2030 terms, sector vocab |
| **Structure** | 15% | Paragraphs, flow, organization |
| **Compliance** | 15% | Requirements, tone, guidelines |

## 🏷️ Issue Severity

| Level | Icon | Action Required |
|-------|------|-----------------|
| **Critical** | 🔴 | Must fix before submission |
| **Warning** | 🟡 | Should fix for better quality |
| **Suggestion** | 💡 | Could improve |

## 🛠️ Components

### QualityScoreBadge
```typescript
<QualityScoreBadge score={75} size="md" showLabel={true} />
```

### QualityPanel
```typescript
<QualityPanel
  score={score}
  isScoring={isScoring}
  error={error}
  onReScore={reScore}
  sectionId={section.id}
/>
```

### BatchScoreButton
```typescript
<BatchScoreButton projectId={projectId} onComplete={() => refresh()} />
```

## 🔧 Utilities

### Batch Score Project
```typescript
import { batchScoreProject } from '@/lib/batchScoring';

const result = await batchScoreProject(projectId, (progress) => {
  console.log(`${progress.completed}/${progress.total}`);
});
```

### Project Summary
```typescript
import { getProjectQualitySummary } from '@/lib/batchScoring';

const summary = await getProjectQualitySummary(projectId);
// { averageScore, totalSections, scoredSections, scoreDistribution }
```

## 📈 Analytics Events

```typescript
analytics.qualityScoreCalculated(sectionId, score, duration);
analytics.qualityIssueClicked(severity, category, sectionId);
analytics.qualitySuggestionApplied(sectionId, suggestionType);
analytics.qualityReScored(sectionId);
```

## ⚙️ Configuration

### Debounce Delay
```typescript
useQualityScore({
  sectionId,
  content,
  debounceDelay: 3000, // 3 seconds (default)
});
```

### Enable/Disable
```typescript
useQualityScore({
  sectionId,
  content,
  enabled: isEditorActive, // Only when editing
});
```

## 💰 Costs

- **API**: ~$0.0005 per score
- **Free Tier**: 15 requests/minute
- **Average**: ~2000 input + 800 output tokens

## 🐛 Troubleshooting

### Score not updating
1. Check content length >= 100 chars
2. Verify `enabled={true}`
3. Check browser console
4. Verify API key is set

### Slow scoring
1. Check rate limits (15 RPM)
2. Verify network
3. Check edge function logs

### View Logs
```bash
supabase functions logs score-section
```

## 📋 Minimum Requirements

- Content length: **100+ characters**
- Debounce delay: **3 seconds** (default)
- Environment: **GOOGLE_AI_API_KEY** must be set

## 🔐 Database Fields

```sql
-- Added to sections table
quality_score INTEGER          -- 0-100
quality_data JSONB            -- Full analysis
last_scored_at TIMESTAMPTZ    -- Last evaluation
```

## 📱 Example Section Card

```typescript
import { QualityScoreBadge } from '@/components/quality';

<div className="flex items-center justify-between">
  <h3>{section.title}</h3>
  <div className="flex items-center gap-2">
    <QualityScoreBadge score={section.qualityScore} />
    <span>{section.charCount} / {section.charLimit}</span>
  </div>
</div>
```

## 🎨 Color Coding

```typescript
// Score to color
const getScoreColor = (score: number) => {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-yellow-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
};
```

## ⚡ Performance Tips

1. Only score when editing (use `enabled` prop)
2. Use higher debounce for slower connections
3. Batch score during off-hours
4. Cache results in database
5. Monitor API usage

## 🔗 Related Files

- Edge Function: `supabase/functions/score-section/index.ts`
- Hook: `src/hooks/useQualityScore.ts`
- Components: `src/components/quality/`
- Utils: `src/lib/batchScoring.ts`
- Migration: `supabase/migrations/20250121000004_quality_scoring.sql`

## 📚 Full Documentation

See `/docs/quality-scoring-system.md` for complete documentation.
