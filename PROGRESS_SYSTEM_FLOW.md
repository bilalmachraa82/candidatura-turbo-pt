# Progress Dashboard System Flow

## Component Hierarchy

```
ProjectPage
│
├─ Tabs (Content | Documents | Progresso)
│   │
│   └─ ProgressTab
│       │
│       ├─ State Management
│       │   ├─ Load checklist overrides from DB
│       │   ├─ Calculate progress (useEffect)
│       │   └─ Handle checklist toggles
│       │
│       └─ Sub-Tabs (Dashboard | Checklist)
│           │
│           ├─ ProgressDashboard
│           │   ├─ Radial Chart (Overall %)
│           │   ├─ Statistics (Sections, Docs, Checklist)
│           │   ├─ Export Button
│           │   ├─ Action Items
│           │   ├─ Status Breakdown
│           │   ├─ Bar Chart (Bottom 10)
│           │   └─ Section Detail List
│           │
│           └─ ProgressChecklist
│               ├─ Overall Progress Bar
│               └─ Accordion (5 categories)
│                   ├─ Content
│                   ├─ Documents
│                   ├─ Budget
│                   ├─ Validation
│                   └─ Submission
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        ProjectPage                          │
│  - Loads project, sections, files from useProject()        │
│  - Manages edit state for project metadata                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─ project: Project
                 ├─ sections: ProjectSection[]
                 ├─ files: UploadedFile[]
                 ├─ onExport: () => void
                 └─ isExporting: boolean
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                        ProgressTab                          │
│  1. Receives props from ProjectPage                        │
│  2. Loads checklist overrides from DB (useEffect)          │
│  3. Converts UploadedFile[] → IndexedFile[]                │
│  4. Calculates progress (useEffect on changes)             │
│  5. Handles checklist toggle → saves to DB                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─ progress: ProjectProgress
                 ├─ onCheckToggle: (itemId, checked) => void
                 └─ onActionClick: (link) => void
                 │
                 ▼
┌──────────────────────────┬──────────────────────────────────┐
│   ProgressDashboard      │     ProgressChecklist            │
│                          │                                  │
│ - Displays progress      │ - Groups by category             │
│ - Renders charts         │ - Auto/manual items              │
│ - Shows action items     │ - Handles user toggles           │
│ - Export button          │ - Action links                   │
└──────────────────────────┴──────────────────────────────────┘
```

## Progress Calculation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   calculateProgress()                       │
│                  (progressCalculator.ts)                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─ Input:
                 │   - project: Project
                 │   - sections: ProjectSection[]
                 │   - files: IndexedFile[]
                 │   - checklistOverrides: Record<string, boolean>
                 │
                 ├─ Process:
                 │   │
                 │   ├─ For each section:
                 │   │   ├─ Calculate charsUsed
                 │   │   ├─ Determine status (empty/draft/review/complete)
                 │   │   └─ Calculate completeness (0-100%)
                 │   │
                 │   ├─ Calculate overall progress (avg of sections)
                 │   │
                 │   ├─ Count documents by category
                 │   │
                 │   ├─ Build checklist items:
                 │   │   ├─ Auto-check items (based on data)
                 │   │   └─ Manual items (from checklistOverrides)
                 │   │
                 │   └─ Generate action items (what needs work)
                 │
                 └─ Output:
                     - overall: number (0-100)
                     - sections: SectionProgress[]
                     - documents: { total, uploaded }
                     - checklist: ChecklistItem[]
                     - actionItems: string[]
```

## Section Status Determination

```
Input: charsUsed, charLimit, validationScore?

┌─────────────────┐
│  charsUsed = 0? │
└────────┬────────┘
         │ YES
         ├────────────────────────────> Status: EMPTY
         │
         │ NO
         ▼
┌──────────────────────────┐
│ charsUsed < 50% limit?   │
└────────┬─────────────────┘
         │ YES
         ├────────────────────────────> Status: DRAFT
         │
         │ NO
         ▼
┌──────────────────────────────────┐
│ validationScore exists?          │
│ AND validationScore >= 70?       │
└────────┬─────────────────────────┘
         │ YES
         ├────────────────────────────> Status: COMPLETE
         │
         │ NO
         ├────────────────────────────> Status: NEEDS_REVIEW
```

## Checklist Auto-Check Examples

```
Item: "Fill all required sections"
┌────────────────────────────────────────────┐
│ Count sections with content > 0           │
│ sectionsFilled / totalSections >= 0.8?    │
└────────┬───────────────────────────────────┘
         │ YES → checked: true
         │ NO  → checked: false


Item: "Upload team CVs"
┌────────────────────────────────────────────┐
│ files.some(f => f.category === 'cv')      │
└────────┬───────────────────────────────────┘
         │ YES → checked: true
         │ NO  → checked: false


Item: "Export enabled"
┌────────────────────────────────────────────┐
│ overall >= 80                             │
└────────┬───────────────────────────────────┘
         │ YES → checked: true
         │ NO  → checked: false
```

## Database Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                    ProgressTab Lifecycle                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. MOUNT (useEffect on project.id)                         │
│    └─ loadChecklistOverrides()                             │
│        - SELECT * FROM checklist_items                     │
│          WHERE project_id = ?                              │
│        - Build overrides object: { itemId: checked }       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CALCULATE (useEffect on deps)                           │
│    └─ calculateProgress(project, sections, files,          │
│                         checklistOverrides)                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER TOGGLES MANUAL ITEM                                │
│    └─ handleCheckToggle(itemId, checked)                   │
│        │                                                    │
│        ├─ Check if exists:                                 │
│        │   SELECT id FROM checklist_items                  │
│        │   WHERE project_id = ? AND item_id = ?            │
│        │                                                    │
│        ├─ If exists: UPDATE                                │
│        │   UPDATE checklist_items                          │
│        │   SET checked = ?, checked_at = now()             │
│        │   WHERE id = ?                                    │
│        │                                                    │
│        └─ If not exists: INSERT                            │
│            INSERT INTO checklist_items                     │
│            (project_id, item_id, checked, checked_at)      │
│            VALUES (?, ?, ?, now())                         │
│                                                             │
│        - Update local checklistOverrides state             │
│        - Triggers recalculation (useEffect)                │
└─────────────────────────────────────────────────────────────┘
```

## Real-Time Update Flow

```
User Action:
  1. Edits section content
  2. Uploads a file
  3. Toggles checklist item

         │
         ▼
┌─────────────────────────┐
│  ProjectPage State      │
│  - sections updated     │
│  - files updated        │
└────────┬────────────────┘
         │
         │ Props change
         ▼
┌─────────────────────────┐
│  ProgressTab            │
│  useEffect triggers     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  calculateProgress()    │
│  - Recalculates         │
└────────┬────────────────┘
         │
         │ New progress object
         ▼
┌─────────────────────────┐
│  Dashboard + Checklist  │
│  - Re-render with new   │
│    progress data        │
│  - Charts update        │
│  - Checkboxes update    │
│  - Action items change  │
└─────────────────────────┘
```

## Export Flow

```
User clicks "Export" button (enabled when overall >= 80%)
         │
         ▼
┌─────────────────────────────────────────┐
│ ProgressDashboard                       │
│ - onClick={onExport}                    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ ProgressTab                             │
│ - onExport prop from ProjectPage        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ ProjectPage.handleExport()              │
│ - setIsExporting(true)                  │
│ - Call export API/service               │
│ - Generate document                     │
│ - Download file                         │
│ - setIsExporting(false)                 │
│ - Show success toast                    │
└─────────────────────────────────────────┘
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**
   ```typescript
   // In ProgressTab
   const indexedFiles = useMemo(
     () => convertToIndexedFiles(files),
     [files]
   );

   const progress = useMemo(
     () => calculateProgress(project, sections, indexedFiles, checklistOverrides),
     [project, sections, indexedFiles, checklistOverrides]
   );
   ```

2. **Debouncing**
   ```typescript
   // When user types in sections
   const debouncedRecalculate = debounce(() => {
     setProgress(calculateProgress(...));
   }, 300);
   ```

3. **Lazy Loading Charts**
   ```typescript
   // Only load Recharts when Progress tab is active
   const Charts = lazy(() => import('./Charts'));
   ```

### Current Implementation
- Calculates on every prop change (project, sections, files, checklist)
- Lightweight calculations (no heavy processing)
- Charts render only when visible (tab-based)
- Database queries only on mount and user actions

---

## Error Handling

### Database Errors
```typescript
try {
  await supabase.from('checklist_items').insert(...);
} catch (error) {
  console.error('Error updating checklist:', error);
  toast({
    variant: 'destructive',
    title: 'Erro',
    description: 'Não foi possível atualizar o checklist'
  });
  // Revert local state if needed
}
```

### Calculation Errors
```typescript
// Defensive checks in calculateProgress
if (!project) {
  return {
    overall: 0,
    sections: [],
    documents: { total: 0, uploaded: 0 },
    checklist: [],
    actionItems: ['Criar um projeto primeiro']
  };
}
```

### Missing Data
```typescript
// Default values for optional fields
const charsUsed = section.content?.length || 0;
const charLimit = section.charLimit || 2000;
const validationScore = undefined; // Future feature
```

---

## State Management Summary

### ProgressTab State
- `progress`: ProjectProgress | null - Calculated progress data
- `checklistOverrides`: Record<string, boolean> - Manual checklist items

### Data Sources
- Props from ProjectPage (project, sections, files)
- Database (checklist_items table)
- Calculated (progress from calculateProgress)

### State Updates
1. **Initial load**: Fetch checklist overrides from DB
2. **Prop changes**: Recalculate progress
3. **User toggle**: Update DB, update local state, recalculate
4. **Real-time**: All updates reflect immediately in UI

---

This flow diagram provides a complete overview of how data flows through the Progress Dashboard system, from initial load to real-time updates and user interactions.
