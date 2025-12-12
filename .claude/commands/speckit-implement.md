# Implement Feature

Execute the implementation plan following the task breakdown.

## Prerequisites

- Feature spec with task breakdown exists
- Constitutional constraints understood
- Patterns from `.prompts/` reviewed

## Workflow

1. **Pre-Implementation Checklist**:
   - [ ] Read `.specs/constitution.md` constraints
   - [ ] Review `.specs/features/<feature-name>.md`
   - [ ] Understand task dependencies
   - [ ] Verify current git branch is a feature branch
   - [ ] Ensure working directory is clean

2. **Implementation Guidelines**:

   **Follow Constitutional Standards** (§III):
   - ✅ Input validation at all boundaries (§III.2)
   - ✅ Server-side authorization checks (§III.2)
   - ✅ Firestore queries use `limit()` (§III.3, §VI.2)
   - ✅ Real-time listeners cleaned up (§IV.2)
   - ✅ Conventional commit format (§III.4)
   - ✅ No secrets in code (§III.2)

   **Apply Patterns from `.prompts/`**:
   - Architecture: `.prompts/core/architecture/modular-architecture-principles.md`
   - Security: `.prompts/core/security/security-principles.md`
   - Firebase: `.prompts/platforms/firebase/firebase-best-practices.md`

   **Avoid Forbidden Patterns** (§IV.2):
   - ❌ Reading entire collections without `limit()`
   - ❌ Real-time subscriptions without cleanup
   - ❌ Client-side filtering (use Firestore queries)
   - ❌ God modules (>500 lines)
   - ❌ Circular dependencies

3. **Implementation Process**:

   **For each task**:
   ```bash
   # 1. Mark task as started (update feature spec)
   # 2. Implement following patterns
   # 3. Test locally
   # 4. Mark task as completed
   # 5. Commit with conventional format
   ```

   **Example commit**:
   ```bash
   git add <files>
   git commit -m "feat: implement user profile data layer

   Add Firestore integration for user profiles with caching.

   Constitutional compliance:
   - §III.2: Input validation on profile updates
   - §III.3: Query uses limit(10) for free tier
   - §VI.2: 1-hour cache TTL implemented

   Guidance references:
   - .prompts/platforms/firebase/firebase-best-practices.md - Query patterns
   - .prompts/core/security/security-principles.md - Input validation
   - .specs/constitution.md §VI.2 - Caching requirements"
   ```

4. **Testing Checklist**:
   - [ ] Feature works in local development
   - [ ] Input validation prevents invalid data
   - [ ] Authorization checks prevent unauthorized access
   - [ ] Firestore queries use `limit()`
   - [ ] Real-time listeners cleanup on component unmount
   - [ ] No console errors
   - [ ] Bundle size acceptable (<50KB additional)

5. **Pre-PR Checklist**:
   - [ ] All tasks completed
   - [ ] All commits follow conventional format
   - [ ] Code follows patterns from `.prompts/`
   - [ ] No forbidden patterns used
   - [ ] Feature tested end-to-end locally
   - [ ] No secrets committed

6. **Create Pull Request**:
   ```bash
   # Push to remote
   git push -u origin feat/<feature-name>

   # Create PR (manual or via gh CLI)
   gh pr create --title "feat: <feature name>" --body "
   ## Summary
   [Brief description of feature]

   ## Changes
   - Implemented <component>
   - Added <service>
   - Integrated with Firestore

   ## Testing
   - [ ] Manual testing of critical paths
   - [ ] Input validation tested
   - [ ] Authorization checks verified
   - [ ] Firestore quota impact assessed

   ## Constitutional Compliance
   - Follows Phase 1 Web Components
   - Adheres to §III quality standards
   - Respects §VI cost constraints

   ## Guidance References
   - `.prompts/core/architecture/modular-architecture-principles.md` - Module structure
   - `.prompts/platforms/firebase/firebase-best-practices.md` - Firestore patterns
   - `.specs/constitution.md` §III, §VI - Quality and cost standards

   Closes #<issue-number>
   "
   ```

7. **Post-Implementation**:
   - [ ] Update feature spec status to "Implemented"
   - [ ] Archive feature spec to `.specs/features/archive/` after merge
   - [ ] Update `architectural-decision-log.md` if phase transition occurred
   - [ ] Update `.specs/constitution.md` if constraints changed

## Quality Assurance

**Before marking feature complete**:
- ✅ Feature meets all acceptance criteria
- ✅ All constitutional constraints respected
- ✅ All foundational patterns followed
- ✅ No forbidden patterns used
- ✅ Testing requirements met
- ✅ Documentation updated
- ✅ PR description complete with guidance references

**After merge**:
- Monitor production for errors
- Track Firestore quota usage
- Verify performance metrics
- Close feature spec
