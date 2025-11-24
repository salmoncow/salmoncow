# Development Prompts Library

Comprehensive development guidance organized by platform-agnostic principles and platform-specific implementations.

---

## Quick Navigation

### 🎯 [Core Principles](./core/) (Platform-Agnostic)
Universal software development principles applicable to any technology stack.

### 🔥 [Firebase Implementation](./platforms/firebase/)
Firebase-specific implementations of core principles.

### 📚 [Meta-Guidance](./meta/)
Library maintenance and prompt management.

---

## Core Principles (Platform-Agnostic)

These principles apply to any technology stack and form the foundation of good software development practices.

### Architecture
- [Code Structure](./core/architecture/code-structure.md) - Separation of concerns, dependency injection, layered architecture
- [Modular Architecture](./core/architecture/modular-architecture-principles.md) - Right-sized modularity, coupling/cohesion
- [Feature Extensibility](./core/architecture/feature-extensibility.md) - Plugin architecture, extensibility patterns

### Development Practices
- [Asset Reusability](./core/development/asset-reusability.md) - DRY principles, asset pipeline, resource management
- [Git Best Practices](./core/development/git-best-practices.md) - Git workflows, commit conventions, branching strategies

### Security
- [Security Principles](./core/security/security-principles.md) - Authentication, authorization, data protection, API security

### Testing & QA
- [Testing Principles](./core/testing/testing-principles.md) - Testing pyramid, unit/integration/E2E testing, best practices

### Deployment & CI/CD
- [Deployment Principles](./core/deployment/deployment-principles.md) - CI/CD pipelines, deployment strategies, release management

### Operations
- [Monitoring Principles](./core/operations/monitoring-principles.md) - Observability pillars, metrics, logs, traces
- [Platform Simplification](./core/operations/platform-simplification-principles.md) - Reducing complexity, minimizing platforms
- [Budget Principles](./core/operations/budget-principles.md) - FinOps, cost optimization, resilience patterns

---

## Firebase Implementation

Firebase-specific patterns, configurations, and best practices. All Firebase guides reference their corresponding core principles.

### Firebase Guides
- [Firebase Best Practices](./platforms/firebase/firebase-best-practices.md) - Firebase SDK patterns, Firestore, Auth
- [Firebase Security](./platforms/firebase/firebase-security.md) - Firestore rules, App Check, custom claims
- [Firebase Testing](./platforms/firebase/firebase-testing.md) - Emulator usage, security rules testing
- [Firebase Deployment](./platforms/firebase/firebase-deployment.md) - GitHub Actions, Hosting, Functions deployment
- [Firebase Monitoring](./platforms/firebase/firebase-monitoring.md) - Performance Monitoring, Analytics, logging
- [Firebase FinOps](./platforms/firebase/firebase-finops.md) - Free tier maximization, cost optimization
- [Firebase Resilience](./platforms/firebase/firebase-resilience.md) - Error handling, retry patterns, budget-friendly resilience
- [Firebase Platform Guide](./platforms/firebase/firebase-platform-guide.md) - Firebase + GitHub simplification strategy

---

## Meta-Guidance

Documentation about maintaining this prompt library.

- [Prompt Maintenance](./meta/prompt-maintenance.md) - Keeping prompts current and accurate

---

## How to Use This Library

### For Architectural Decisions
1. Start with [Core Principles](./core/) to understand universal patterns
2. Reference [Firebase Implementation](./platforms/firebase/) for specific implementation details
3. Cross-reference between core and platform-specific guides

### For New Features
1. Review [Modular Architecture](./core/architecture/modular-architecture-principles.md)
2. Check [Feature Extensibility](./core/architecture/feature-extensibility.md)
3. See [Firebase Best Practices](./platforms/firebase/firebase-best-practices.md) for implementation

### For Security Implementation
1. Study [Security Principles](./core/security/security-principles.md) for universal patterns
2. Implement using [Firebase Security](./platforms/firebase/firebase-security.md) guide

### For Deployment Setup
1. Understand [Deployment Principles](./core/deployment/deployment-principles.md)
2. Configure using [Firebase Deployment](./platforms/firebase/firebase-deployment.md)

---

## Philosophy

### Core Principles
**Universal, reusable guidance** that applies regardless of hosting platform or cloud provider. These principles represent fundamental software engineering best practices.

### Platform Implementations
**Concrete, actionable patterns** for specific technologies. Firebase implementations show how to apply core principles using Firebase services.

### Future Extensibility
This structure supports adding new platforms (Vercel, AWS, Netlify) without modifying core principles:

```
.prompts/platforms/
├── firebase/      # Current
├── vercel/        # Future
├── aws/           # Future
└── netlify/       # Future
```

---

## Contributing to This Library

See [Prompt Maintenance](./meta/prompt-maintenance.md) for guidelines on:
- Updating existing prompts
- Adding new prompts
- Maintaining accuracy
- Version management

---

## Reorganization History

**2025-11-18**: Major reorganization to separate platform-agnostic principles from Firebase-specific implementations. See `REORGANIZATION_PLAN.md` for details.

**Previous structure**: All prompts in flat `.prompts/` directory with mixed universal/Firebase content.

**Current structure**: Organized into `core/` (universal) and `platforms/` (specific) with clear cross-references.
