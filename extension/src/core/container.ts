// Tiny token-based DI container. Background/content/popup all construct their
// own container, register concrete implementations, and consume by token only.
// This is the single point where concrete services are wired.

export class Token<T> {
  constructor(public readonly name: string) {}
  // brand for inference
  declare readonly _type: T;
}

type Factory<T> = (c: Container) => T;

export class Container {
  private factories = new Map<Token<unknown>, Factory<unknown>>();
  private singletons = new Map<Token<unknown>, unknown>();

  register<T>(token: Token<T>, factory: Factory<T>): void {
    this.factories.set(token as Token<unknown>, factory as Factory<unknown>);
  }

  resolve<T>(token: Token<T>): T {
    const cached = this.singletons.get(token as Token<unknown>);
    if (cached !== undefined) return cached as T;
    const factory = this.factories.get(token as Token<unknown>);
    if (!factory) throw new Error(`DI: no factory for token ${token.name}`);
    const value = factory(this) as T;
    this.singletons.set(token as Token<unknown>, value);
    return value;
  }
}
