# Project Constitution: SalmonCow Web Application

**Version:** 1.0.0
**Last Updated:** 2025-12-11
**Scope:** All development on the SalmonCow project
**Review Frequency:** Quarterly (next review: 2026-03-11)

---

## Introduction

This constitutional spec establishes the governing principles, standards, and constraints for the SalmonCow project. It serves as the single source of truth for project-specific requirements while cross-referencing detailed patterns in `.prompts/` for implementation guidance.

**Relationship to `.prompts/` System:**
- This constitution defines **project-specific** constraints and standards
- `.prompts/` provides **foundational, universal** patterns and best practices
- When developing features, consult this constitution first, then reference `.prompts/` for detailed patterns

---

## I. Core Principles

### I.1 Progressive Complexity

**Philosophy**: Start simple, add complexity only when justified by measurable pain.

**Principles:**
- Follow phase-based evolution (Phase 1 → 2 → 3 → 4, never skip phases)
- Measure before evolving - use decision triggers from architectural-evolution-strategy.md
- Each phase teaches lessons needed for the next
- Avoid premature optimization and over-engineering

**Reference**: [.prompts/meta/architectural-evolution-strategy.md](.prompts/meta/architectural-evolution-strategy.md)

### I.2 Platform Simplification

**Philosophy**: Minimize platforms and dependencies to reduce operational overhead.

**Constraints:**
- **Maximum platforms**: 2-3 platforms total
- **Current platforms**: Firebase + GitHub (2 platforms)
- **New platform addition requires**:
  - All decision triggers met from platform-simplification-principles.md
  - Explicit justification why existing platforms insufficient
  - Documented evaluation of extending current platforms first

**Reference**: [.prompts/core/operations/platform-simplification-principles.md](.prompts/core/operations/platform-simplification-principles.md)

### I.3 AI-Assisted Evolution

**Philosophy**: Choose technologies that support future AI-assisted migrations.

**Requirements:**
- Select technologies with ≥80% AI migration capability
- Document patterns clearly for future AI refactoring
- Maintain clear migration paths between architectural phases
- Current technology choices:
  - Vanilla Web Components → Lit (95% AI-assisted migration)
  - Lit → React (80% AI-assisted migration)

**Reference**: [.prompts/meta/architectural-evolution-strategy.md](.prompts/meta/architectural-evolution-strategy.md) §II.1

---

## II. Architectural Standards

### II.1 Current Architectural State

**Last Updated**: 2025-12-11
**Source**: [.prompts/meta/architectural-decision-log.md](.prompts/meta/architectural-decision-log.md)

| Domain | Current Phase | Target Phase | Status |
|--------|---------------|--------------|---------|
| **UI Components** | Phase 1: Vanilla Web Components | Phase 2: Lit | Monitor component count (~3-4 currently) |
| **Security** | Phase 1: Basic Auth + Rules | Phase 2: App Check + Custom Claims | Awaiting production launch |
| **Data** | Phase 1: Simple Collections | Phase 2: Optimized NoSQL | Monitor query complexity |
| **Testing** | Phase 1: Manual | Phase 2: Unit Tests | Approaching trigger (4 modules) |
| **Deployment** | Phase 1: Manual | Phase 2: GitHub Actions | Monitor deploy frequency |
| **Monitoring** | Phase 1: Manual | Phase 2: Firebase Performance | Awaiting production launch |
| **Cost** | Phase 1: Free Tier | Phase 2: Optimized Free Tier | Monitor usage growth |
| **Platform** | 2 platforms (Firebase + GitHub) | Maintain at 2 | Avoid additions |

**Key Metrics** (as of 2025-12-11):
- **Active Users**: 0 (pre-launch)
- **Components**: 3-4 (navigation, auth UI, loading states)
- **Modules**: 4 (auth, ui, navigation, main)
- **Routes**: 1 (homepage)
- **Team Size**: 1 developer
- **Firebase Usage**: <100 reads/day (0.2% of limit), <10 writes/day (0.05% of limit)

### II.2 Evolution Triggers

**Before advancing to next phase**, consult architectural-evolution-strategy.md for domain-specific triggers.

**General Principle**: Don't advance phases until measurable pain justifies the complexity increase.

**Examples:**
- UI: Phase 1 → Phase 2 requires 10+ components AND 3+ of these: manual state sync errors, verbose syntax slowing dev, component >100 lines due to boilerplate
- Testing: Phase 1 → Phase 2 requires 10+ modules OR production launch planned
- Deployment: Phase 1 → Phase 2 requires daily deployments OR team size ≥2

**Reference**: [.prompts/meta/architectural-evolution-strategy.md](.prompts/meta/architectural-evolution-strategy.md) - Decision Triggers for each domain

### II.3 Modularity Requirements

**Principles** (distilled from modular-architecture-principles.md):

1. **Single Responsibility**: Each module has one clear purpose
2. **Clear Interfaces**: Module contracts documented and stable
3. **Dependency Direction**: Application → Service → Infrastructure (never reverse)
4. **Feature-Based Organization**: Organize by feature over technical layer
5. **Module Size**: Target <500 lines per module; split if exceeding 750 lines

**Anti-Patterns (Forbidden)**:
- ❌ God modules (>500 lines, multiple responsibilities)
- ❌ Circular dependencies between modules
- ❌ Tight coupling between feature modules
- ❌ Direct infrastructure dependencies in application code

**Reference**: [.prompts/core/architecture/modular-architecture-principles.md](.prompts/core/architecture/modular-architecture-principles.md)

### II.4 Code Structure Standards

**Principles** (distilled from code-structure.md):

1. **Separation of Concerns**: UI, business logic, data access in separate layers
2. **Dependency Injection**: Inject dependencies, don't hardcode
3. **Layered Architecture**:
   - Presentation Layer (UI components)
   - Application Layer (business logic)
   - Infrastructure Layer (Firebase, external APIs)

**Directory Structure**:
```
src/
├── components/     # UI layer (Web Components)
├── services/       # Application layer (business logic)
├── infrastructure/ # Infrastructure layer (Firebase SDK)
└── utils/          # Shared utilities
```

**Reference**: [.prompts/core/architecture/code-structure.md](.prompts/core/architecture/code-structure.md)

---

## III. Quality Standards

### III.1 Testing Requirements

**Test Pyramid** (from testing-principles.md):
- **70% Unit Tests**: Fast, isolated, test individual functions and components
- **20% Integration Tests**: Test component interactions and data flows
- **10% E2E Tests**: Test complete user workflows

**Coverage Targets**:
- **Overall**: ≥80% code coverage
- **Critical paths** (auth, payment, data security): 100% coverage
- **All tests must pass** before merge to main

**Test Requirements**:
- Use AAA pattern (Arrange, Act, Assert)
- Descriptive test names explaining the scenario
- Test edge cases and error conditions
- Security tests required for auth/authorization code

**Current State**: Phase 1 (Manual testing)
**Next Trigger**: 10+ modules OR production launch planned

**Reference**: [.prompts/core/testing/testing-principles.md](.prompts/core/testing/testing-principles.md)

### III.2 Security Standards

**Authentication & Authorization** (from security-principles.md):
- Input validation at **all** boundaries (client AND server)
- **Never** trust client-side authentication state
- **Never** rely solely on UI restrictions for authorization
- Server-side authorization checks on **every** protected operation
- Use OAuth federation with trusted providers (Google, GitHub)
- Implement proper session management and token refresh

**Data Protection**:
- Validate all user inputs (allowlists over blocklists)
- Sanitize data before storage and display (prevent XSS, injection)
- Encrypt sensitive data at rest and in transit
- Minimize PII collection (data minimization)
- Implement GDPR compliance (data export, deletion, consent)

**Firebase-Specific**:
- Firestore security rules tested in emulator **before** deployment
- No secrets in client code (use environment variables + Functions)
- App Check enabled for production (when advancing to Phase 2)

**Reference**:
- [.prompts/core/security/security-principles.md](.prompts/core/security/security-principles.md)
- [.prompts/platforms/firebase/firebase-security.md](.prompts/platforms/firebase/firebase-security.md)

### III.3 Performance Standards

**Targets** (measurable at production launch):
- **Page Load Time**: <3 seconds (p95)
- **Time to Interactive (TTI)**: <5 seconds (p95)
- **First Contentful Paint (FCP)**: <1.5 seconds (p95)
- **Cumulative Layout Shift (CLS)**: <0.1
- **Largest Contentful Paint (LCP)**: <2.5 seconds

**Firebase Quota Constraints** (free tier):
- **Firestore reads**: <50,000/day (implement caching at 70% = 35,000/day)
- **Firestore writes**: <20,000/day
- **Hosting transfer**: <360MB/day
- **Storage**: <1GB

**Optimization Requirements**:
- Lazy load non-critical resources
- Batch Firestore operations where possible
- Implement client-side caching for frequently accessed data
- Use Firestore queries (not client-side filtering)
- Monitor usage weekly, optimize at 70% of any limit

**Reference**:
- [.prompts/core/operations/monitoring-principles.md](.prompts/core/operations/monitoring-principles.md)
- [.prompts/platforms/firebase/firebase-finops.md](.prompts/platforms/firebase/firebase-finops.md)

### III.4 Code Quality Standards

**Git Workflow** (from git-best-practices.md):
- **Conventional commits format**: `<type>: <description>` (e.g., `feat:`, `fix:`, `docs:`, `refactor:`)
- **Atomic commits**: One logical change per commit
- **Commit messages**: Clear, descriptive, explain "why" not just "what"
- **PR descriptions**: Must include Summary, Changes, Testing, Guidance References sections
- **No force pushes** to main/master
- **Branch naming**: `<type>/<description>` (e.g., `feat/add-user-dashboard`)

**Code Review**:
- All changes via Pull Request (no direct commits to main)
- PR requires: passing tests (when implemented), no merge conflicts, updated documentation
- Self-review before requesting review

**Documentation**:
- Code comments for non-obvious logic only
- README.md for each major component/module
- Document architectural decisions in architectural-decision-log.md

**Reference**: [.prompts/core/development/git-best-practices.md](.prompts/core/development/git-best-practices.md)

---

## IV. Technology Standards

### IV.1 Approved Technology Stack

**Frontend**:
- **UI Framework**: Vanilla JavaScript + Web Components (Phase 1)
- **Build Tool**: Vite (see `.specs/technical/build-system.md` for configuration)
- **Styling**: CSS (no framework yet, scoped to components)

**Backend**:
- **Platform**: Firebase
  - Authentication (OAuth: Google, GitHub)
  - Firestore (NoSQL database)
  - Hosting (static site)
  - Functions (future, when needed)
- **SDK Version**: Firebase v12.x+ (with AI Logic SDK when available)

**Development**:
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions (when Phase 2 deployment triggered)
- **Testing**: Manual (Phase 1); will use testing library when Phase 2 triggered

**Reference**: [.prompts/platforms/firebase/firebase-best-practices.md](.prompts/platforms/firebase/firebase-best-practices.md)

### IV.2 Forbidden Patterns

**Firebase Anti-Patterns** (will break free tier or cause errors):
- ❌ Reading entire Firestore collections without limits (`getDocs()` without query limits)
- ❌ Real-time subscriptions (`onSnapshot()`) without cleanup
- ❌ Client-side filtering (use Firestore queries: `where()`, `limit()`, `orderBy()`)
- ❌ Nested real-time listeners (cascading subscriptions)
- ❌ Large document reads without pagination
- ❌ Missing indexes for compound queries (causes query failures)

**Architecture Anti-Patterns**:
- ❌ God modules (>500 lines, multiple responsibilities)
- ❌ Circular dependencies between modules
- ❌ Premature abstraction (creating abstractions before 3+ use cases)
- ❌ Skipping architectural phases (must go Phase 1 → 2 → 3, not 1 → 3)

**Code Quality Anti-Patterns**:
- ❌ Committing secrets or API keys
- ❌ Force pushing to main/master
- ❌ Non-descriptive commit messages ("wip", "fix", "updates")
- ❌ Skipping PR process for code changes

**Reference**:
- [.prompts/platforms/firebase/firebase-best-practices.md](.prompts/platforms/firebase/firebase-best-practices.md) - Anti-patterns
- [.prompts/platforms/firebase/firebase-resilience.md](.prompts/platforms/firebase/firebase-resilience.md) - Error patterns

### IV.3 Technology Evaluation Criteria

**Before adopting new technology, evaluate**:
1. **Does it fit within current platforms?** (Firebase, GitHub)
2. **Can existing platforms provide this capability?**
3. **What complexity does it add?**
4. **What is AI migration capability?** (target: ≥80%)
5. **What is the learning curve?**
6. **What are the long-term maintenance implications?**

**Decision Process**:
1. Identify the need/pain point
2. Evaluate extending existing platforms first
3. Check architectural-evolution-strategy.md for decision triggers
4. Document evaluation in architectural-decision-log.md
5. If adding new platform, requires explicit approval

**Reference**: [.prompts/core/operations/platform-simplification-principles.md](.prompts/core/operations/platform-simplification-principles.md)

---

## V. Development Workflow

### V.1 Feature Development Process

**Standard workflow for all new features**:

1. **Consult Constitution**: Read this document for project constraints and current architectural phase
2. **Create Specification**: Use `/speckit.specify <feature-name>` to create feature requirements
   - Reference constitutional constraints (current phases, quality standards, forbidden patterns)
   - Cite applicable `.prompts/core/*` patterns for architecture approach
3. **Plan Implementation**: Use `/speckit.plan` to design technical approach
   - Reference `.prompts/platforms/firebase/*` for Firebase implementation guidance
   - Consider evolution triggers - does this feature push us to next phase?
4. **Break Down Work**: Use `/speckit.tasks` to create actionable task list
5. **Implement**: Use `/speckit.implement` to execute
   - Follow patterns from `.prompts/core/` for architecture
   - Follow guidance from `.prompts/platforms/firebase/` for Firebase SDK usage
   - Adhere to quality standards (§III)
   - Avoid forbidden patterns (§IV.2)
6. **Test**: Validate against constitutional standards
   - Security: input validation, authorization checks
   - Performance: check Firestore query patterns, caching
   - Code quality: conventional commits, PR description
7. **Document**:
   - Commit with guidance references in commit message
   - PR description includes: Summary, Changes, Testing, Guidance References
   - Update architectural-decision-log.md if phase transition occurred

**Example Feature Workflow**:
```bash
# 1. Create spec
/speckit.specify user-profile-page

# 2. Plan implementation (returns technical spec referencing prompts)
/speckit.plan

# 3. Break down tasks
/speckit.tasks

# 4. Implement
/speckit.implement

# 5. Test & validate against constitution

# 6. Commit with references
git commit -m "feat: add user profile page

Implements user profile with Firestore integration.

Constitutional compliance:
- §III.2: Input validation on profile updates
- §III.3: Query uses limit() to stay within free tier
- §IV.2: No client-side filtering, uses Firestore where()

Guidance references:
- .prompts/core/architecture/modular-architecture-principles.md - feature-based structure
- .prompts/platforms/firebase/firebase-best-practices.md - Firestore query patterns"
```

### V.2 Architectural Evolution Process

**When considering evolution to next phase**:

1. **Check Current State**: Review [.prompts/meta/architectural-decision-log.md](.prompts/meta/architectural-decision-log.md) for current phases
2. **Evaluate Triggers**: Consult [.prompts/meta/architectural-evolution-strategy.md](.prompts/meta/architectural-evolution-strategy.md) for domain-specific decision triggers
3. **If Triggers Met**:
   - Create evolution spec: `/speckit.specify architectural-evolution-<domain>`
   - Document decision in architectural-decision-log.md
   - Update this constitution (§II.1) with new phase
   - Plan migration strategy
   - Execute migration
4. **If Triggers NOT Met**:
   - Stay in current phase
   - Document why (cite specific unmet triggers)
   - Continue monitoring metrics

**Example Evolution Decision**:
```
Domain: UI Components
Current: Phase 1 (Vanilla Web Components), 3-4 components
Trigger Check: Phase 1 → Phase 2 requires 10+ components AND 3+ pain points
Result: NOT MET (only 3-4 components, < 10 threshold)
Decision: Stay in Phase 1, revisit when component count reaches 10
```

### V.3 Prompt Gap Protocol

**If guidance is insufficient for a task**:

1. **STOP**: Do not guess or hallucinate guidance
2. **Flag Gap**: Follow [.prompts/meta/prompt-gap-protocol.md](.prompts/meta/prompt-gap-protocol.md)
3. **Assess Coverage**:
   - Is this a constitutional spec gap? (project-specific constraint missing)
   - Is this a prompt gap? (foundational pattern missing)
   - Is this a technical spec gap? (project configuration missing)
4. **Recommend Creation**:
   - Constitutional gap → Update this file
   - Prompt gap → Create/update file in `.prompts/`
   - Technical gap → Create file in `.specs/technical/`
5. **Do NOT Proceed** until gap is addressed

**Reference**: [.prompts/meta/prompt-gap-protocol.md](.prompts/meta/prompt-gap-protocol.md)

---

## VI. Cost Constraints

### VI.1 Firebase Free Tier Limits

**Spark Plan Quotas** (verified 2025-12-11):
- **Firestore**:
  - Reads: 50,000/day
  - Writes: 20,000/day
  - Deletes: 20,000/day
  - Storage: 1GB
  - Network egress: 10GB/month
- **Authentication**: Unlimited
- **Hosting**:
  - Storage: 10GB
  - Transfer: 360MB/day
- **Cloud Functions**: Not available on free tier (requires Blaze plan)

**Hard Constraints**:
- **MUST stay within free tier** for first 6 months
- **MUST implement caching/optimization** before hitting 70% of any limit
- **Functions deployment** requires explicit decision to upgrade to Blaze plan

**Reference**: [.prompts/platforms/firebase/firebase-finops.md](.prompts/platforms/firebase/firebase-finops.md)

### VI.2 Cost Optimization Requirements

**Mandatory Optimizations**:
1. **Implement client-side caching** for frequently accessed data (>1 hour TTL)
2. **Use Firestore queries** with `limit()` - never read entire collections
3. **Batch operations** where possible (batch writes save write quota)
4. **Lazy load** resources (defer non-critical loads)
5. **Monitor usage weekly** - check Firebase console every Monday
6. **Alert at 70%** of any quota limit - trigger optimization sprint

**Firestore Best Practices** (cost-saving):
- Use `where()` queries instead of client-side filtering
- Implement pagination with `limit()` and `startAfter()`
- Cache query results in memory or localStorage
- Use `onSnapshot()` sparingly (prefer one-time reads for static data)
- Always clean up real-time listeners on component unmount
- Use indexes efficiently (compound queries need indexes)

**Example Caching Pattern**:
```javascript
// Cache reads with 1-hour TTL
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getCachedUser(uid) {
  const cached = cache.get(uid);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data; // Saves 1 Firestore read
  }

  const userData = await getDoc(doc(db, 'users', uid));
  cache.set(uid, { data: userData.data(), timestamp: Date.now() });
  return userData.data();
}
```

**Reference**:
- [.prompts/platforms/firebase/firebase-finops.md](.prompts/platforms/firebase/firebase-finops.md)
- [.prompts/platforms/firebase/firebase-resilience.md](.prompts/platforms/firebase/firebase-resilience.md)

### VI.3 Usage Monitoring

**Weekly Monitoring** (every Monday):
1. Check Firebase console → Usage tab
2. Record metrics:
   - Firestore reads/writes/deletes (% of daily limit)
   - Hosting transfer (% of daily limit)
   - Storage usage (% of 1GB limit)
3. If any metric >50%, investigate top consumers
4. If any metric >70%, trigger optimization sprint
5. If any metric >90%, emergency optimization + consider phase evolution

**Quarterly Review** (with architectural review):
- Assess 3-month usage trends
- Project 6-month usage at current growth rate
- Evaluate if free tier sustainable
- Plan for scale if approaching limits

---

## VII. References

### VII.1 Foundational Guidance (Always Consult)

**Core Architecture**:
- [code-structure.md](.prompts/core/architecture/code-structure.md) - Separation of concerns, layered architecture
- [modular-architecture-principles.md](.prompts/core/architecture/modular-architecture-principles.md) - Modularity, coupling/cohesion
- [feature-extensibility.md](.prompts/core/architecture/feature-extensibility.md) - Extension patterns, plugin architecture

**Core Security**:
- [security-principles.md](.prompts/core/security/security-principles.md) - Auth/authz, data protection, API security

**Core Testing**:
- [testing-principles.md](.prompts/core/testing/testing-principles.md) - Testing pyramid, coverage targets

**Core Operations**:
- [platform-simplification-principles.md](.prompts/core/operations/platform-simplification-principles.md) - Platform selection
- [budget-principles.md](.prompts/core/operations/budget-principles.md) - FinOps, cost efficiency
- [monitoring-principles.md](.prompts/core/operations/monitoring-principles.md) - Observability patterns

**Core Development**:
- [git-best-practices.md](.prompts/core/development/git-best-practices.md) - Git workflow, conventional commits
- [asset-reusability.md](.prompts/core/development/asset-reusability.md) - DRY principles, resource management

### VII.2 Platform Implementation (Reference as Needed)

**Firebase**:
- [firebase-best-practices.md](.prompts/platforms/firebase/firebase-best-practices.md) - SDK patterns, Firestore, Auth, Functions
- [firebase-security.md](.prompts/platforms/firebase/firebase-security.md) - Security rules, App Check, custom claims
- [firebase-testing.md](.prompts/platforms/firebase/firebase-testing.md) - Emulator usage, rules testing
- [firebase-monitoring.md](.prompts/platforms/firebase/firebase-monitoring.md) - Performance monitoring, Analytics, logging
- [firebase-finops.md](.prompts/platforms/firebase/firebase-finops.md) - Free tier optimization, cost patterns
- [firebase-resilience.md](.prompts/platforms/firebase/firebase-resilience.md) - Error handling, retry patterns

### VII.3 Strategic Frameworks (For Evolution Decisions)

**Meta Guidance**:
- [architectural-evolution-strategy.md](.prompts/meta/architectural-evolution-strategy.md) - Phase-based evolution, decision triggers
- [architectural-decision-log.md](.prompts/meta/architectural-decision-log.md) - Historical decisions, current state
- [prompt-gap-protocol.md](.prompts/meta/prompt-gap-protocol.md) - Handling insufficient guidance
- [prompt-maintenance.md](.prompts/meta/prompt-maintenance.md) - Keeping prompts current

### VII.4 Technical Specifications (Project Configuration)

**Build & Deployment**:
- [.specs/technical/build-system.md](.specs/technical/build-system.md) - Vite configuration (when created)
- [.specs/technical/cicd-pipeline.md](.specs/technical/cicd-pipeline.md) - GitHub Actions (when created)
- [.specs/technical/firebase-deployment.md](.specs/technical/firebase-deployment.md) - Deployment process (when created)

### VII.5 Spec-Kit Workflow Commands

**Feature Development**:
- `/speckit.specify <feature-name>` - Create feature requirement spec
- `/speckit.plan` - Generate technical implementation plan
- `/speckit.tasks` - Break down into actionable tasks
- `/speckit.implement` - Execute implementation
- `/speckit.constitution` - View this constitutional spec

**Quality Assurance**:
- `/speckit.checklist` - Generate quality validation checklist
- `/speckit.analyze` - Validate spec consistency

---

## VIII. Maintenance & Review

### VIII.1 Review Schedule

**Quarterly Reviews** (every 3 months):
- **Next Review**: 2026-03-11
- **Review Items**:
  - Update Current Architectural State (§II.1) with latest metrics
  - Review evolution triggers - any domains approaching phase transition?
  - Update forbidden patterns if new anti-patterns discovered
  - Refine quality standards based on learnings
  - Check Firebase free tier quotas (verify limits unchanged)
  - Update technology versions if needed

**Annual Deep Review** (every 12 months):
- Comprehensive audit of all sections
- Evaluate if constitutional structure still appropriate
- Consider consolidation opportunities
- Assess spec-kit adoption and effectiveness
- Review and update references to `.prompts/`

### VIII.2 Amendment Process

**Minor Updates** (metrics, current state, reference links):
- Update directly, increment patch version (1.0.0 → 1.0.1)
- Update "Last Updated" date
- Document in git commit message

**Major Updates** (new standards, changed principles):
- Create proposal in architectural-decision-log.md
- Increment minor version (1.0.0 → 1.1.0)
- Update "Last Updated" date
- Communicate changes to team

**Breaking Changes** (removed/incompatible standards):
- Requires explicit decision log entry
- Increment major version (1.0.0 → 2.0.0)
- Migration plan required
- Document deprecation timeline

### VIII.3 Success Metrics

**Adoption Metrics**:
- 100% of new features reference this constitution
- 80%+ of new features use spec-kit workflow
- 100% of architectural decisions cite constitutional sections
- Zero features violate forbidden patterns

**Quality Metrics**:
- Conventional commits: 100% compliance
- PR descriptions: 100% include Guidance References section
- Security: Zero auth/authz bugs in production
- Performance: Meet all targets in §III.3
- Cost: Stay within free tier limits

**Long-term Health**:
- Quarterly reviews completed on schedule
- Constitution kept current (<30 days since last update)
- Zero duplication between constitution and `.prompts/`
- Clear decision trail for all architectural changes

---

## IX. Appendix

### IX.1 Quick Reference

**Current State (as of 2025-12-11)**:
- Phase 1 across all domains
- 3-4 components, 4 modules, 1 route
- 1 developer, 0 active users
- 2 platforms (Firebase + GitHub)
- <1% of Firebase free tier usage

**Key Thresholds**:
- Unit testing: Trigger at 10 modules (currently 4)
- UI framework (Lit): Trigger at 10 components (currently 3-4)
- CI/CD: Trigger at daily deploys (currently manual)
- Cost optimization: Alert at 70% of any Firebase limit

**Mandatory Before Every Commit**:
- ✅ Input validation on all boundaries
- ✅ Server-side auth checks (if auth-related)
- ✅ Firestore queries use `limit()` (if Firestore-related)
- ✅ Real-time listeners cleaned up (if using `onSnapshot()`)
- ✅ Conventional commit format
- ✅ No secrets in code

**Mandatory Before Every PR**:
- ✅ PR description includes Summary, Changes, Testing, Guidance References
- ✅ No force pushes to main
- ✅ All tests passing (when testing implemented)
- ✅ No merge conflicts

### IX.2 Common Patterns

**Firestore Read Pattern**:
```javascript
// ✅ CORRECT: Query with limit
const users = await getDocs(query(
  collection(db, 'users'),
  where('active', '==', true),
  limit(10)
));

// ❌ WRONG: Reading entire collection
const users = await getDocs(collection(db, 'users'));
```

**Firestore Real-Time Pattern**:
```javascript
// ✅ CORRECT: Cleanup subscription
const unsubscribe = onSnapshot(doc(db, 'users', uid), (doc) => {
  console.log(doc.data());
});

// Cleanup on component unmount
onUnmount(() => unsubscribe());

// ❌ WRONG: No cleanup (memory leak + unnecessary reads)
onSnapshot(doc(db, 'users', uid), (doc) => {
  console.log(doc.data());
});
```

**Auth Check Pattern**:
```javascript
// ✅ CORRECT: Server-side check
// Firestore rules:
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// ❌ WRONG: Client-only check
if (currentUser.uid === userId) {
  // Can be bypassed by manipulating client code
  updateUser(userData);
}
```

---

**End of Constitutional Spec**

This document is the living constitution for the SalmonCow project. It evolves with the project but maintains stability as the foundation for all development decisions.

**Version History:**
- 1.0.0 (2025-12-11): Initial constitutional spec created as part of spec-kit integration
