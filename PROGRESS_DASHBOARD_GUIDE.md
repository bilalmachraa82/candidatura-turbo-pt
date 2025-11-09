# Progress Dashboard and Checklist System

## Overview

The Progress Dashboard and Checklist system provides comprehensive tracking and visualization of PT2030 project candidatura (application) completion status. It calculates progress based on section completion, document uploads, and checklist items, helping users understand what's complete and what still needs attention.

## Architecture

### Core Components

1. **Progress Calculator** (`src/lib/progressCalculator.ts`)
   - Core business logic for calculating project progress
   - Section status determination
   - Overall progress calculation
   - Action items generation

2. **Progress Dashboard** (`src/components/project/ProgressDashboard.tsx`)
   - Visual representation of project progress
   - Radial chart for overall progress
   - Bar charts for section completion
   - Section status breakdown
   - Action items alerts

3. **Progress Checklist** (`src/components/project/ProgressChecklist.tsx`)
   - Interactive checklist organized by category
   - Auto-checked items based on project state
   - Manual checklist items for user tracking
   - Progress indicators per category

4. **Progress Tab** (`src/components/project/ProgressTab.tsx`)
   - Integration component that combines Dashboard and Checklist
   - Manages state and database operations
   - Handles checklist toggle events

### Database Schema

**Table: `checklist_items`**
```sql
id              UUID PRIMARY KEY
project_id      UUID (references projects)
item_id         TEXT (unique identifier like 'budget-detailed')
checked         BOOLEAN
checked_at      TIMESTAMPTZ
checked_by      UUID (references auth.users)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

## Progress Calculation Logic

### Section Status

Each section is assigned one of four statuses:

1. **Empty** (`empty`)
   - Condition: `charsUsed === 0`
   - Color: Gray
   - Meaning: No content has been added yet

2. **Draft** (`draft`)
   - Condition: `charsUsed > 0 AND charsUsed < 50% of charLimit`
   - Color: Yellow
   - Meaning: Section has content but is less than halfway complete

3. **Needs Review** (`needs_review`)
   - Condition: `charsUsed >= 50% AND (no validation OR validationScore < 70)`
   - Color: Orange
   - Meaning: Section is substantially filled but needs validation or improvement

4. **Complete** (`complete`)
   - Condition: `charsUsed >= 50% AND validationScore >= 70`
   - Color: Green
   - Meaning: Section is filled and has passed validation

### Section Completeness Calculation

Completeness is a percentage (0-100%) calculated as follows:

```typescript
fillPercentage = min((charsUsed / charLimit) * 100, 100)

if (no validationScore):
  completeness = fillPercentage * 0.7  // Max 70% without validation

else:
  completeness = fillPercentage * 0.7 + validationScore * 0.3
  // Weighted: 70% fill rate, 30% validation score
```

### Overall Progress

Overall project progress is the average of all section completeness percentages:

```typescript
overall = sum(section.completeness for all sections) / totalSections
```

### Document Tracking

Documents are tracked by category:
- **cv**: Team technical CVs
- **budget**: Budget quotations (minimum 3 required)
- **financial**: Financial documents (IRS/IRC declarations)
- **company**: Company documents (certificates, statutes)
- **technical**: Technical specifications
- **legal**: Legal documents, licenses

## Checklist System

### Checklist Categories

1. **Content** (`content`)
   - Section filling requirements
   - All sections completion tracking

2. **Documents** (`documents`)
   - Required document uploads
   - Auto-checked based on file categories

3. **Budget** (`budget`)
   - Budget validation (manual checks)
   - Cost justification verification

4. **Validation** (`validation`)
   - Eligibility verification (manual)
   - Timeline confirmation (manual)
   - Final review (manual)

5. **Submission** (`submission`)
   - Export capability (auto-enabled at 80% progress)
   - Signature collection (manual)
   - Platform submission (manual)

### Auto-Check vs Manual Items

**Auto-Checked Items:**
- Automatically updated based on project state
- Cannot be manually toggled
- Examples:
  - "Fill all required sections" (checks if 80%+ sections have content)
  - "Upload team CVs" (checks for files with category='cv')
  - "Export enabled" (checks if overall >= 80%)

**Manual Items:**
- User must manually check/uncheck
- Stored in database
- Examples:
  - "Budget detailed with 3 quotes per item"
  - "Verify project eligibility"
  - "Collect necessary signatures"

### Checklist Item Example

```typescript
{
  id: 'docs-cv',
  category: 'documents',
  task: 'Upload CV da equipa técnica',
  checked: hasFileCategory(files, 'cv'),  // Auto-checked
  autoCheck: true,
  link: 'documents'  // Navigates to documents tab
}
```

## Action Items

Action items are automatically generated based on project state:

1. **Empty Sections**: "Preencher X secções vazias"
2. **Draft Sections**: "Completar X secções em rascunho (< 50% do limite)"
3. **Review Sections**: "Rever X secções que precisam de validação"
4. **Missing Documents**: "Fazer upload do CV da equipa técnica"
5. **Missing Budgets**: "Fazer upload de orçamentos detalhados"

## Thresholds

Key progress thresholds defined in `src/data/pt2030Checklist.ts`:

```typescript
PROGRESS_THRESHOLDS = {
  EXPORT_ENABLED: 80,      // Min progress to enable export
  READY_TO_SUBMIT: 95,     // Recommended before submission
  SECTION_MINIMUM: 50,     // Min section completeness
  VALIDATION_SCORE: 70     // Min validation score for "complete"
}
```

## User Interface

### Progress Dashboard Tab

**Visual Components:**
1. **Radial Progress Chart**
   - Shows overall percentage
   - Color-coded (red < 80%, yellow 80-95%, green >= 95%)
   - Center displays percentage number

2. **Statistics Cards**
   - Sections completed (X / Total)
   - Documents uploaded (X / Total)
   - Checklist items (X / Total)
   - Progress bars for each

3. **Export Button**
   - Enabled when overall >= 80%
   - Shows minimum threshold when disabled
   - Triggers export functionality

4. **Action Items Alert**
   - Displays items needing attention
   - Orange border for visibility
   - Actionable descriptions

5. **Section Status Breakdown**
   - Four cards showing counts by status
   - Empty (gray), Draft (yellow), Review (orange), Complete (green)

6. **Bottom 10 Sections Chart**
   - Horizontal bar chart
   - Shows 10 sections with lowest completeness
   - Helps identify what needs work

7. **Detailed Section List**
   - All sections with:
     - Section code badge
     - Status badge
     - Title
     - Character count
     - Completeness percentage
     - Progress bar
     - Completion icon (if complete)

### Progress Checklist Tab

**Features:**
1. **Overall Progress Bar**
   - Shows total checklist completion
   - X / Total items format

2. **Accordion by Category**
   - Expandable sections per category
   - Category icon and label
   - Item count badge (X / Total)
   - Category description
   - Category progress bar

3. **Checklist Items**
   - Checkbox (disabled for auto-check items)
   - Task description
   - Auto badge (for auto-checked items)
   - Completed badge (when checked)
   - Action link button (if applicable)
   - Strike-through when completed

4. **Legend**
   - Explains auto-check badge
   - Describes disabled checkboxes
   - Shows action link functionality

## Integration

### In ProjectPage.tsx

The Progress tab is added alongside Content and Documents:

```tsx
<Tabs defaultValue="content">
  <TabsList>
    <TabsTrigger value="content">Conteúdo</TabsTrigger>
    <TabsTrigger value="documents">Documentos</TabsTrigger>
    <TabsTrigger value="progress">Progresso</TabsTrigger>
  </TabsList>

  <TabsContent value="progress">
    <ProgressTab
      project={project}
      sections={sections}
      files={files}
      onExport={handleExport}
      isExporting={isExporting}
    />
  </TabsContent>
</Tabs>
```

## Data Flow

1. **Initial Load**
   - ProjectPage loads project, sections, and files from database
   - ProgressTab receives props and loads checklist overrides
   - Progress is calculated using `calculateProgress()`

2. **Real-Time Updates**
   - When sections are edited, progress recalculates
   - When files are uploaded, document checklist auto-updates
   - When user toggles manual checklist items, state updates

3. **Database Sync**
   - Manual checklist toggles are saved to `checklist_items` table
   - Row-level security ensures users only see their own data
   - Timestamps track when items were checked

4. **Export Trigger**
   - Export button enabled when overall >= 80%
   - Clicking export calls `handleExport()` in ProjectPage
   - Can be integrated with existing export functionality

## Future Enhancements

Potential improvements for the system:

1. **Validation Scores**
   - Implement AI-based content validation
   - Store validation scores in database
   - Update section status based on scores

2. **Progress Notifications**
   - Email alerts when milestones reached
   - Reminder notifications for incomplete items
   - Deadline warnings

3. **Historical Tracking**
   - Track progress over time
   - Show progress timeline chart
   - Compare progress across projects

4. **Collaborative Features**
   - Assign checklist items to team members
   - Track who completed what
   - Team progress overview

5. **Export Templates**
   - Different export formats based on progress
   - Draft vs final exports
   - Validation report generation

6. **Smart Recommendations**
   - AI-suggested next actions
   - Priority ranking of tasks
   - Estimated time to completion

## Files Summary

### Created Files

1. `/src/lib/progressCalculator.ts` - Core calculation logic
2. `/src/data/pt2030Checklist.ts` - Checklist definitions
3. `/src/components/project/ProgressDashboard.tsx` - Dashboard UI
4. `/src/components/project/ProgressChecklist.tsx` - Checklist UI
5. `/src/components/project/ProgressTab.tsx` - Integration component
6. `/supabase/migrations/20250121000002_add_checklist.sql` - Database schema

### Modified Files

1. `/src/integrations/supabase/types.ts` - Added checklist_items table type
2. `/src/pages/ProjectPage.tsx` - Added Progress tab integration

## Testing Checklist

To verify the implementation:

- [ ] Progress Dashboard displays overall percentage
- [ ] Section status is correctly calculated
- [ ] Action items appear when needed
- [ ] Charts render properly (radial, bar)
- [ ] Export button enables at 80% progress
- [ ] Checklist items group by category
- [ ] Auto-check items update automatically
- [ ] Manual items can be toggled
- [ ] Database saves manual checklist state
- [ ] Progress updates in real-time
- [ ] Navigation between tabs works
- [ ] RLS policies protect user data

## Support

For questions or issues:
- Review calculation logic in `progressCalculator.ts`
- Check component props and state in browser DevTools
- Verify database queries in Supabase dashboard
- Test RLS policies with different users
