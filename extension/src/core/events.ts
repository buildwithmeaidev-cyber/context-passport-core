// Tiny typed event bus. Used for cross-module decoupling within a single
// runtime (background OR popup OR content). Cross-runtime messaging goes
// through chrome.runtime.sendMessage in shared/messaging.ts.
export type Handler<P> = (payload: P) => void;

export class EventBus<EventMap extends Record<string, unknown>> {
  private handlers = new Map<keyof EventMap, Set<Handler<unknown>>>();

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<unknown>);
    return () => set!.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of set) (h as Handler<EventMap[K]>)(payload);
  }
}
