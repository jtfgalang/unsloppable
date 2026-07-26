"use client";

import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

export function useHydratedReducedMotion() {
  const reduceMotion = useReducedMotion();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  return hydrated && Boolean(reduceMotion);
}
