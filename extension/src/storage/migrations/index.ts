import type { Versioned } from "./schema";

/**
 * migrations[N] migrates a Versioned<unknown> from version N to N+1.
 * Add a new entry when bumping CURRENT_VERSION. Never modify existing entries.
 */
export const migrations: Record<number, (key: string, value: Versioned<unknown>) => Versioned<unknown>> = {
  // Example placeholder for future use:
  // 1: (_key, v) => ({ __v: 2, data: transform(v.data) }),
};
