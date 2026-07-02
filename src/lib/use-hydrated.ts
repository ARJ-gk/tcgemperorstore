"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns false during SSR and the first client render, then true once
 * hydrated — without calling setState in an effect. Use to gate rendering of
 * client-only state (e.g. the localStorage-backed cart) and avoid hydration
 * mismatches.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
