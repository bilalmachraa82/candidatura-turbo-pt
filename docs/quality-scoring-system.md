# AI-Powered Quality Scoring System

## Overview

The Quality Scoring System provides real-time AI-powered feedback on PT2030 section content, helping users improve their submissions before finalizing them.

## Features

### 1. Automatic Quality Scoring
- **Debounced Evaluation**: Automatically scores content 3 seconds after user stops typing
- **AI-Powered Analysis**: Uses Gemini 2.0 Flash for intelligent content evaluation
- **Multi-Criteria Scoring**: Evaluates 5 key dimensions of content quality

### 2. Scoring Criteria

#### Completeness (25%)
- Character count vs limit (optimal: 70-95% of limit)
- Presence of introduction, body, and conclusion
- Coverage of required aspects

#### Specificity (25%)
- Use of concrete numbers, percentages, dates
- Avoidance of generic language ("muito bom", "vários", etc.)
- Inclusion of measurable examples

#### Keywords (20%)
- PT2030-specific terminology
- Sector-specific vocabulary
- Technical alignment with program objectives

#### Structure (15%)
- Paragraph count (ideal: 3-5)
- Paragraph length (ideal: 100-200 words)
- Logical flow and organization

#### Compliance (15%)
- Meets section-specific requirements
- Professional and formal tone
- No prohibited content

### 3. Issue Reporting

Issues are categorized by severity:

- **Critical** 🔴: Must fix before submission
- **Warning** 🟡: Should fix for better quality
- **Suggestion** 💡: Could improve with these changes

Each issue includes:
- Clear description of the problem
- Specific, actionable suggestion for improvement
- Category classification

## Usage

### Basic Integration

```typescript
import { useQualityScore } from '@/hooks/useQualityScore';
import { QualityPanel } from '@/components/quality';

function SectionEditor({ section }) {
  const { score, isScoring, error, reScore } = useQualityScore({
    sectionId: section.id,
    content: section.content,
    enabled: true,
    debounceDelay: 3000,
  });

  return (
    <div>
      {/* Your editor */}
      <QualityPanel
        score={score}
        isScoring={isScoring}
        error={error}
        onReScore={reScore}
        sectionId={section.id}
      />
    </div>
  );
}
```

### Quality Score Badge

Display quality scores in lists or cards:

```typescript
import { QualityScoreBadge } from '@/components/quality';

<QualityScoreBadge
  score={75}
  showLabel={true}
  size="md"
/>
```

### Batch Scoring

Score all sections in a project at once:

```typescript
import { BatchScoreButton } from '@/components/quality';

<BatchScoreButton
  projectId={projectId}
  onComplete={() => {
    // Refresh data
  }}
/>
```

Or programmatically:

```typescript
import { batchScoreProject } from '@/lib/batchScoring';

const result = await batchScoreProject(projectId, (progress) => {
  console.log(`${progress.completed} / ${progress.total}`);
  console.log(`Current: ${progress.current}`);
});
```

### Quality Summary

Get project-wide quality statistics:

```typescript
import { getProjectQualitySummary } from '@/lib/batchScoring';

const summary = await getProjectQualitySummary(projectId);
console.log(`Average score: ${summary.averageScore}`);
console.log(`Excellent sections: ${summary.scoreDistribution.excellent}`);
```

## Components

### QualityPanel

Full-featured quality analysis panel with:
- Overall score with progress bar
- Breakdown of 5 scoring dimensions
- Categorized issues list
- Strengths identification
- Improvement suggestions
- Re-score button
- Collapsible interface

**Props:**
- `score`: QualityScore | null
- `isScoring`: boolean
- `error`: string | null
- `onReScore`: () => void
- `sectionId`: string
- `className?`: string

### QualityScoreBadge

Compact score display with color-coded feedback.

**Props:**
- `score`: number (0-100)
- `showLabel?`: boolean (default: true)
- `className?`: string
- `size?`: 'sm' | 'md' | 'lg' (default: 'md')

**Score Ranges:**
- 85-100: Excellent (Green)
- 70-84: Good (Yellow)
- 50-69: Needs Work (Orange)
- 0-49: Insufficient (Red)

### BatchScoreButton

Trigger batch scoring with progress dialog.

**Props:**
- `projectId`: string
- `onComplete?`: () => void
- `variant?`: 'default' | 'outline' | 'ghost'
- `size?`: 'default' | 'sm' | 'lg'

## Hooks

### useQualityScore

React hook for quality scoring with auto-debouncing.

```typescript
const {
  score,      // Current quality score
  isScoring,  // Loading state
  error,      // Error message
  reScore,    // Manual re-score function
} = useQualityScore({
  sectionId: string,
  content: string,
  enabled?: boolean,
  debounceDelay?: number,
});
```

### useDebounce

General-purpose debounce hook.

```typescript
const debouncedValue = useDebounce(value, delay);
```

## Edge Functions

### score-section

Serverless function that performs AI-powered content analysis.

**Endpoint:** `/functions/v1/score-section`

**Request:**
```json
{
  "sectionId": "uuid",
  "content": "string"
}
```

**Response:**
```json
{
  "success": true,
  "score": {
    "overall": 75,
    "breakdown": {
      "completeness": 80,
      "specificity": 70,
      "keywords": 75,
      "structure": 75,
      "compliance": 75
    },
    "issues": [...],
    "strengths": [...],
    "suggestions": [...]
  },
  "metrics": {...}
}
```

## Database Schema

```sql
ALTER TABLE sections ADD COLUMN quality_score INTEGER;
ALTER TABLE sections ADD COLUMN quality_data JSONB;
ALTER TABLE sections ADD COLUMN last_scored_at TIMESTAMPTZ;
```

**Fields:**
- `quality_score`: Overall score (0-100)
- `quality_data`: Full quality analysis JSON
- `last_scored_at`: Timestamp of last evaluation

## Analytics Events

The system tracks the following events:

```typescript
analytics.qualityScoreCalculated(sectionId, score, duration);
analytics.qualityIssueClicked(severity, category, sectionId);
analytics.qualitySuggestionApplied(sectionId, suggestionType);
analytics.qualityReScored(sectionId);
```

## Best Practices

### 1. Enable Selectively
Only enable scoring on active editor views to avoid unnecessary API calls:

```typescript
const { score } = useQualityScore({
  sectionId,
  content,
  enabled: isEditorActive, // Only when editing
});
```

### 2. Handle Errors Gracefully
Always provide feedback when scoring fails:

```typescript
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### 3. Debounce Appropriately
- 3000ms (3 seconds) is good for auto-scoring
- Lower values (1000ms) for more responsive feedback
- Higher values (5000ms) to reduce API calls

### 4. Batch Score Wisely
- Use batch scoring for initial project setup
- Use batch scoring after bulk content imports
- Avoid during active editing sessions

### 5. Cache Results
Quality scores are automatically saved to the database, reducing redundant calculations.

## Performance Considerations

### Rate Limits
- Gemini 2.0 Flash: 15 RPM (requests per minute) on free tier
- Batch scoring includes 500ms delays between requests
- Edge functions have built-in timeout handling

### Costs
- Gemini 2.0 Flash: $0.10 per 1M input tokens, $0.40 per 1M output tokens
- Average scoring request: ~2000 input tokens, ~800 output tokens
- Cost per score: ~$0.0005 (very low)

### Optimization Tips
1. Only score content with 100+ characters
2. Use debouncing to avoid scoring every keystroke
3. Cache scores in database
4. Consider disabling auto-score for premium users

## Troubleshooting

### Score Not Updating
- Check that content length is >= 100 characters
- Verify `enabled` prop is true
- Check browser console for errors
- Ensure GOOGLE_AI_API_KEY is configured

### Slow Scoring
- Gemini API may have rate limits
- Check network connectivity
- Verify edge function logs in Supabase dashboard

### Inaccurate Scores
- Review section description and requirements
- Ensure content is in Portuguese
- Check for special characters or formatting issues
- Provide feedback to improve AI prompts

## Future Enhancements

Potential improvements:
1. **Section-Specific Scoring**: Custom criteria per section type
2. **Historical Tracking**: Show score improvements over time
3. **Comparative Analysis**: Compare scores across similar projects
4. **Smart Suggestions**: AI-generated content improvements
5. **Plagiarism Detection**: Check for duplicate content
6. **Readability Metrics**: Flesch reading ease, etc.
7. **Export Reports**: PDF quality reports for review

## Support

For issues or questions:
1. Check the browser console for errors
2. Review Supabase edge function logs
3. Verify API key configuration
4. Contact support with error details
