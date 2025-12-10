# Architectural Decision Log

**Purpose**: Historical record of architectural decisions made for this project
**Format**: Append new entries (newest first)
**Related**: See [architectural-evolution-strategy.md](./architectural-evolution-strategy.md) for decision frameworks

---

## How to Use This Log

### Adding Decisions

When making architectural changes, add an entry using this template:

```markdown
### YYYY-MM-DD: [Decision Title]

**Domains Affected**: [UI, Security, Data, Testing, Deployment, Monitoring, Cost, Platform]

**Current Phase** → **New Phase**:
- Domain 1: Phase X → Phase Y
- Domain 2: Phase X → Phase Y

**Decision**:
[What was decided]

**Rationale**:
[Why this decision was made]
- Pain point 1
- Pain point 2
- Trigger conditions met

**Alternatives Considered**:
- Option A: [reason for rejection]
- Option B: [reason for rejection]

**Success Criteria**:
- [ ] Metric 1: target
- [ ] Metric 2: target
- [ ] Review at: [date]

**Implementation Notes**:
[Any important details for future reference]

---
```

---

## Current Architectural State

**Last Updated**: 2025-12-09

### Domain Phases

| Domain | Current Phase | Next Phase | Triggers to Watch |
|--------|--------------|------------|-------------------|
| **UI Components** | Phase 1: Vanilla Web Components | Phase 2: Lit | Component count (currently ~3) |
| **Security** | Phase 1: Basic Auth + Rules | Phase 2: App Check + Custom Claims | Production launch |
| **Data** | Phase 1: Simple Collections | Phase 2: Optimized NoSQL | Query complexity |
| **Testing** | Phase 1: Manual | Phase 2: Unit Tests | Module count (currently ~4) |
| **Deployment** | Phase 1: Manual | Phase 2: GitHub Actions | Deploy frequency |
| **Monitoring** | Phase 1: Manual | Phase 2: Firebase Performance | Production launch |
| **Cost** | Phase 1: Free Tier | Phase 2: Optimized Free Tier | Usage growth |
| **Platform** | 2 platforms (Firebase + GitHub) | Maintain | Avoid additions |

### Key Metrics (as of 2025-12-09)

- **Active Users**: 0 (pre-launch)
- **Components**: ~3-4 (navigation, auth UI, loading states)
- **Modules**: 4 (auth, ui, navigation, main)
- **Routes**: 1 (homepage)
- **Team Size**: 1 developer
- **Firebase Usage**:
  - Reads/day: <100 / 50K limit
  - Writes/day: <10 / 20K limit
  - Hosting: <1MB / 360MB limit
- **Platform Count**: 2 (Firebase + GitHub)

---

## Decision Log Entries

### 2025-12-09: Establish Progressive Architecture Strategy

**Domains Affected**: All

**Current Phase** → **New Phase**:
- All domains: Undefined → Phase 1 (defined starting points)

**Decision**:
Adopt a progressive, AI-friendly architectural evolution strategy across all domains. Start with minimal complexity (vanilla JS, Firebase-only, manual processes) and evolve deliberately based on measured triggers.

**Rationale**:
- **Platform Simplification**: Minimize operational overhead by consolidating on Firebase + GitHub (2 platforms total)
- **Progressive Complexity**: Avoid over-engineering at MVP stage; add complexity only when pain justifies it
- **AI-Assisted Evolution**: Choose technologies (Web Components, Firebase) that support high-quality AI-assisted migrations
- **Flexibility**: Maintain clear migration paths to Lit and React if project scales
- **Cost Management**: Stay within Firebase free tier as long as possible

**Specific Component Strategy**:
- Start with Vanilla Web Components for UI reusability
- Enables component reusability without framework overhead
- Natural migration path: Vanilla WC → Lit (95% AI-assisted) → React (80% AI-assisted)
- Solves immediate need (auth loading flash) while maintaining flexibility

**Alternatives Considered**:
1. **React from start**:
   - Rejected: Over-engineering for MVP with <5 components
   - Would add framework overhead and complexity prematurely
   - Migration from React is harder than migration to React

2. **Template Functions (Vanilla)**:
   - Rejected: Less reusable than Web Components
   - More verbose for component reuse
   - Harder migration path to Lit/React

3. **No component strategy**:
   - Rejected: Leads to code duplication and inconsistent patterns
   - Harder to maintain as project grows

4. **Multiple platforms** (e.g., Firebase + AWS + Vercel):
   - Rejected: Operational overhead of managing multiple platforms
   - Conflicts with platform simplification principle

**Success Criteria**:
- [ ] Stay within Firebase free tier for 6 months
- [ ] Zero platform additions for 6 months (unless Firebase insufficient)
- [ ] Create 10+ reusable Web Components within 6 months
- [ ] Developer satisfaction ≥7/10 with chosen architecture
- [ ] Successful quarterly architectural reviews (next: 2026-03-09)
- [ ] If migration needed, AI-assisted migration ≥80% success rate

**Implementation Notes**:
- Created architectural-evolution-strategy.md for evergreen guidance
- Created architectural-decision-log.md (this file) for historical tracking
- Immediate next step: Implement Web Components for auth loading state
- Component directory structure: `/src/components/`
- Document components in `/src/components/README.md`

**Review Date**: 2026-03-09 (quarterly review)

---

## Future Decisions

Add new decision entries above this line.

Use the template provided at the top of this file.

---

## How Claude Should Use This Log

### For Current State Queries

```
User: "What phase are we in for UI components?"
Claude: Check architectural-decision-log.md → Current Architectural State table
Response: "Phase 1: Vanilla Web Components (as of last update)"
```

### For Evolution Recommendations

```
User: "Should we migrate to React?"
Claude:
1. Check decision log → Current: Phase 1 (Vanilla WC), ~3-4 components
2. Check strategy → Phase 1 → Phase 3 trigger: Need 50+ components
3. Response: "Not yet. Currently ~3-4 components, triggers require 50+."
4. Cite: architectural-evolution-strategy.md triggers for Phase 1 → Phase 3
```

### For Adding Decisions

```
User: "We're adding unit tests"
Claude:
1. Check strategy → Testing: Phase 1 → Phase 2 triggers
2. Verify triggers met (e.g., 10+ modules, production planned)
3. Add decision log entry using template
4. Update "Current Architectural State" table
5. Document decision rationale
```

### For Historical Context

```
User: "Why did we choose Web Components?"
Claude: Check architectural-decision-log.md → 2025-12-09 entry
Response: "Rationale: Platform simplification, AI-assisted migration path..."
```

---

## Notes

- **This log is append-only**: Never delete entries, only add new ones
- **Keep strategy evergreen**: Update architectural-evolution-strategy.md for frameworks, not this log
- **Update current state**: When decisions are made, update the Current Architectural State table
- **Review quarterly**: During quarterly reviews, assess if current phases still accurate
