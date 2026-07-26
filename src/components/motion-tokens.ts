/**
 * Shared motion constants.
 *
 * This file lives inside the component folder so the registry ships it alongside
 * any component that imports it. Components must reference it relatively
 * (`./motion-tokens`); an `@/` alias would not survive `shadcn add`.
 */
export const OPEN_UI_MOTION = {
  ease: [0.16, 1, 0.3, 1] as const,
  revealDuration: 760,
  revealDistance: 38,
  magneticStrength: 0.22,
  magneticRadius: 140,
  magneticChildStrength: 0.08,
  maxTilt: 3.2,
  spotlightRadius: 520,
};
