# Create Implementation Plan

Generate a detailed technical implementation plan for a feature specification.

## Prerequisites

- Feature specification exists at `.specs/features/<feature-name>.md`
- Constitutional constraints reviewed
- Foundational patterns identified

## Workflow

1. **Review Feature Spec**:
   - Read `.specs/features/<feature-name>.md`
   - Understand requirements and acceptance criteria
   - Identify constitutional constraints cited

2. **Design Technical Approach**:
   - Apply patterns from `.prompts/core/architecture/`
   - Follow Firebase best practices from `.prompts/platforms/firebase/`
   - Respect current architectural phase (from constitution §II.1)
   - Avoid forbidden patterns (from constitution §IV.2)

3. **Create Technical Plan** (add to feature spec as Section X):
   ```markdown
   ## X. Technical Implementation Plan

   ### Architecture
   [Apply patterns from .prompts/core/architecture/modular-architecture-principles.md]
   - Module structure
   - Component hierarchy
   - Dependency flow

   ### Data Layer
   [Apply patterns from .prompts/platforms/firebase/firebase-best-practices.md]
   - Firestore collections and documents
   - Query patterns (with limit() for free tier)
   - Security rules required

   ### UI Components
   [Following current phase: Vanilla Web Components]
   - Component breakdown
   - Props/attributes
   - Events/callbacks

   ### Security Implementation
   [Following .prompts/core/security/security-principles.md]
   - Input validation points
   - Authorization checks
   - Data sanitization

   ### Testing Strategy
   [Following constitution §III.1]
   - Unit tests to write
   - Integration tests needed
   - Manual testing checklist

   ### Performance Considerations
   [Following constitution §III.3]
   - Bundle size impact
   - Firestore quota usage estimate
   - Caching strategy

   ### Implementation Steps
   1. [Step-by-step tasks in order]
   2. ...

   ### Files to Create/Modify
   - `/src/components/...` (new Web Component)
   - `/src/services/...` (business logic)
   - `/src/infrastructure/...` (Firebase integration)

   ### Estimated Complexity
   - Firestore reads/writes per user action
   - Lines of code estimate
   - Testing effort
   ```

4. **Validate Plan**:
   - ✅ Respects current architectural phase
   - ✅ Uses approved patterns from `.prompts/`
   - ✅ Avoids forbidden patterns
   - ✅ Addresses quality standards
   - ✅ Stays within cost constraints (free tier)

**Next Step**: Use `/speckit-tasks` to break down into actionable tasks
