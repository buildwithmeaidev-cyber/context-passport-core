export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(msg: string, meta?: unknown): void;
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
}

export class ConsoleLogger implements Logger {
  constructor(private readonly scope: string, private readonly min: LogLevel = "info") {}
  private order: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
  private should(l: LogLevel): boolean {
    return this.order[l] >= this.order[this.min];
  }
  private fmt(l: LogLevel, msg: string, meta?: unknown): unknown[] {
    const tag = `[ContextPassport:${this.scope}] ${l.toUpperCase()}`;
    return meta === undefined ? [tag, msg] : [tag, msg, meta];
  }
  debug(m: string, meta?: unknown): void { if (this.should("debug")) console.debug(...this.fmt("debug", m, meta)); }
  info(m: string, meta?: unknown): void { if (this.should("info")) console.info(...this.fmt("info", m, meta)); }
  warn(m: string, meta?: unknown): void { if (this.should("warn")) console.warn(...this.fmt("warn", m, meta)); }
  error(m: string, meta?: unknown): void { if (this.should("error")) console.error(...this.fmt("error", m, meta)); }
}
