import { z } from 'zod';

// Input schema for the setUserRole callable. Validated server-side as the
// single source of truth for what the client is allowed to submit.
// Spec §VII.3, §XI.4.
export const setUserRoleInput = z.object({
    targetUid: z.string().min(1).max(128),
    role: z.enum(['owner', 'admin', 'user']),
});

export type SetUserRoleInput = z.infer<typeof setUserRoleInput>;
