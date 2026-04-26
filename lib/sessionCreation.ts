// lib/sessionCreation.ts
//
// Tracks background session creation promises so [sessionId].tsx can await
// them before streaming, in case the user sends a message before the
// background createSession() call has resolved.
//
// Usage:
//   trackSession(id, chatApi.createSession({ id }).then(() => {}));
//   await waitForSession(id); // instant no-op once resolved

const pending = new Map<string, Promise<void>>();

export function trackSession(id: string, promise: Promise<void>): void {
  const tracked = promise.finally(() => pending.delete(id));
  pending.set(id, tracked);
}

export async function waitForSession(id: string): Promise<void> {
  const p = pending.get(id);
  if (p) await p;
}
