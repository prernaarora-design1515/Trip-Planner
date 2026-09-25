"use client";

import { useEffect, useState } from "react";

export interface Identity {
  memberId: string;
  token: string;
}

function key(tripId: string): string {
  return `tripwise:${tripId}`;
}

export function getIdentity(tripId: string): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(tripId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.memberId === "string" && typeof parsed?.token === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setIdentity(tripId: string, identity: Identity) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(tripId), JSON.stringify(identity));
}

export function newDeviceToken(): string {
  return crypto.randomUUID();
}

// localStorage isn't available during SSR, so reading it directly in a
// render body makes the client's first (hydration) render disagree with
// the server's. This hook always renders `checked: false` on the first
// pass - matching the server - and only reads the real value in an effect,
// which runs after hydration.
export function useIdentity(tripId: string): { identity: Identity | null; checked: boolean } {
  const [state, setState] = useState<{ identity: Identity | null; checked: boolean }>({
    identity: null,
    checked: false,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage only after hydration, by design
    setState({ identity: getIdentity(tripId), checked: true });
  }, [tripId]);

  return state;
}
