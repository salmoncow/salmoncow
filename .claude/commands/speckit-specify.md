# Create Feature Specification

Create a feature requirement specification using spec-driven development principles.

## Workflow

1. **Understand the Feature**: Ask clarifying questions about:
   - User goals and scenarios
   - Acceptance criteria
   - Edge cases and error conditions
   - Integration points with existing code

2. **Consult Constitutional Constraints**:
   - Read `.specs/constitution.md` for project-specific constraints
   - Check current architectural phase (e.g., UI: Phase 1 Vanilla WC, Security: Phase 1 Basic Auth)
   - Verify against quality standards (testing, security, performance)
   - Identify forbidden patterns to avoid

3. **Reference Foundational Patterns**:
   - Consult `.prompts/core/architecture/` for architectural patterns
   - Check `.prompts/core/security/` for security requirements
   - Review `.prompts/platforms/firebase/` for Firebase implementation guidance

4. **Create Feature Spec** at `.specs/features/<feature-name>.md`:
   ```markdown
   # Feature Specification: <Feature Name>

   **Version**: 1.0.0
   **Created**: YYYY-MM-DD
   **Status**: Draft

   ## I. Overview
   [Brief description of feature and purpose]

   ## II. Constitutional Constraints
   [Reference relevant sections from .specs/constitution.md]
   - Current phase constraints
   - Quality standards that apply
   - Forbidden patterns to avoid

   ## III. User Stories
   [User-focused descriptions of desired functionality]

   ## IV. Acceptance Criteria
   [Testable requirements that define success]

   ## V. Architecture Approach
   [Pattern references: .prompts/core/architecture/...]

   ## VI. Security Requirements
   [Pattern references: .prompts/core/security/...]

   ## VII. Firebase Implementation
   [Pattern references: .prompts/platforms/firebase/...]

   ## VIII. Testing Requirements
   [From constitution §III.1]

   ## IX. References
   - Constitutional constraints cited
   - Foundational patterns referenced
   ```

5. **Validate Against Constitution**:
   - Ensure feature respects current architectural phase
   - Verify no forbidden patterns used
   - Confirm quality standards addressed

**Next Step**: Use `/speckit-plan` to create technical implementation plan
