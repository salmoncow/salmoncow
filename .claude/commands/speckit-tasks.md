# Break Down Into Tasks

Generate an actionable task list from the technical implementation plan.

## Prerequisites

- Feature spec with implementation plan exists
- Technical approach defined
- Files and changes identified

## Workflow

1. **Review Implementation Plan**:
   - Read feature spec's Technical Implementation Plan (Section X)
   - Understand file changes needed
   - Identify dependencies between tasks

2. **Create Task Breakdown** (add to feature spec as Section XI):
   ```markdown
   ## XI. Task Breakdown

   ### Task 1: Setup & Structure
   - [ ] Create component directory `/src/components/<feature>/`
   - [ ] Create service module `/src/services/<feature>.js`
   - [ ] Create Firebase integration `/src/infrastructure/<feature>-firebase.js`
   - [ ] Add exports to main index files

   ### Task 2: Data Layer Implementation
   - [ ] Define Firestore schema (collection/document structure)
   - [ ] Implement Firestore CRUD operations with `limit()`
   - [ ] Add caching layer (1-hour TTL per constitution §VI.2)
   - [ ] Write security rules in firestore.rules
   - [ ] Test security rules in Firebase emulator

   ### Task 3: Business Logic
   - [ ] Implement service layer functions
   - [ ] Add input validation (constitution §III.2)
   - [ ] Add error handling with try/catch
   - [ ] Implement authorization checks

   ### Task 4: UI Components
   - [ ] Create Web Component class
   - [ ] Define component template (HTML)
   - [ ] Add component styles (scoped CSS)
   - [ ] Implement event handlers
   - [ ] Add loading states
   - [ ] Add error states

   ### Task 5: Integration
   - [ ] Wire service layer to Firebase
   - [ ] Connect UI to service layer
   - [ ] Test full user flow end-to-end

   ### Task 6: Testing & Validation
   - [ ] Manual test critical paths
   - [ ] Verify input validation works
   - [ ] Test authorization checks
   - [ ] Check Firestore quota usage
   - [ ] Verify bundle size impact (<50KB target)

   ### Task 7: Documentation & Deployment
   - [ ] Update README if needed
   - [ ] Write commit message (conventional format)
   - [ ] Create PR with guidance references
   - [ ] Deploy and verify in production
   ```

3. **Prioritize Tasks**:
   - Order by dependency (data layer before UI)
   - Identify critical path
   - Mark blockers clearly

4. **Estimate Complexity**:
   - Simple tasks: <30min
   - Medium tasks: 30min-2hours
   - Complex tasks: >2hours (consider breaking down further)

**Next Step**: Use `/speckit-implement` to execute tasks
