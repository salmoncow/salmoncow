// Cloud Functions entry point for Salmoncow RBAC.
// Spec: .specs/archive/001-multi-user-rbac/spec.md §XI.4
export { setUserRole } from './setUserRole.js';
export { onUserCreate } from './onUserCreate.js';
