import { z } from 'zod';

// Input schema for the setUserRole callable. Validated server-side as the
// single source of truth for what the client is allowed to submit.
// Spec §VII.3, §XI.4.
export const setUserRoleInput = z.object({
    targetUid: z.string().min(1).max(128),
    role: z.enum(['owner', 'admin', 'user']),
});

export type SetUserRoleInput = z.infer<typeof setUserRoleInput>;

// Input schema for the logClientError callable.
//
// Every bound here is a cost control as much as a validation rule: this
// endpoint is reachable by any client holding a valid App Check token, and its
// output goes to Cloud Logging, which bills on ingestion volume. Caps stop a
// single call from writing an unbounded log entry. `.strict()` rejects unknown
// keys outright rather than silently forwarding whatever a caller invents.
export const logClientErrorInput = z
    .object({
        message: z.string().min(1).max(1000),
        stack: z.string().max(4000).nullable().optional(),
        source: z.string().min(1).max(100),
        severity: z.enum(['error', 'warning']),
        route: z.string().max(200).nullable().optional(),
        at: z.string().datetime().optional(),
        // Free-form diagnostic detail from the reporter (file/line/col, etc).
        // Values are constrained to primitives so nested objects can't be used
        // to smuggle a large payload past the per-field caps.
        context: z
            .record(
                z.string().max(64),
                z.union([z.string().max(500), z.number(), z.boolean(), z.null()]),
            )
            .refine((c) => Object.keys(c).length <= 20, {
                message: 'context may not exceed 20 keys',
            })
            .optional(),
    })
    .strict();

export type LogClientErrorInput = z.infer<typeof logClientErrorInput>;
