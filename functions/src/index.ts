// Cloud Functions entry point for Salmoncow RBAC.
// Spec: .specs/features/001-multi-user-rbac/spec.md §X.4
export { setUserRole } from './setUserRole.js';
export { onUserCreate } from './onUserCreate.js';
