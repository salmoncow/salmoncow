# Active Feature Specs

Per-feature specifications created via `/speckit-specify` live here while the
feature is in flight. Each feature is a **directory**, not a single file:

```
.specs/features/<NNN-feature-name>/
├── spec.md        # requirements, acceptance criteria, technical plan
├── tasks.md       # ordered, committable task breakdown
└── *.md           # optional: runbooks, notes, supplementary docs
```

The three-digit numeric prefix (e.g. `001-multi-user-rbac`) keeps features
sorted chronologically and makes references stable across renames.

**Lifecycle:**
1. `/speckit-specify <feature-name>` — creates the directory + `spec.md`
2. `/speckit-plan` — appends a **Technical Implementation Plan** section to `spec.md`
3. `/speckit-tasks` — produces `tasks.md`
4. `/speckit-implement` — executes against the plan
5. After PR merge: `git mv .specs/features/<name>/ .specs/archive/<name>/`

See the project's spec-kit overview at [../README.md](../README.md) for the
portability rule that drove the archive/ vs features/ split.
