// Composition root for runtimes that don't need DOM (background, popup, options).
// The content script has its own composition (see content/index.ts) because
// DOM-bound services live there.

import { Container } from "@/core/container";
import { ConsoleLogger } from "@/core/logger";
import { Tokens } from "@/core/tokens";
import { ChromeLocalDriver, StorageGateway } from "@/storage";
import { createDefaultRegistry } from "@/providers/registry";
import { VaultService } from "@/services/vault/VaultService";
import { LicenseService } from "@/services/license/LicenseService";
import { FeatureFlagService } from "@/services/license/FeatureFlagService";
import { CompressionService } from "@/services/compression/CompressionService";

export async function buildContainer(scope: string): Promise<Container> {
  const c = new Container();
  c.register(Tokens.Logger, () => new ConsoleLogger(scope));
  c.register(Tokens.Storage, (x) => new StorageGateway(new ChromeLocalDriver(), x.resolve(Tokens.Logger)));
  c.register(Tokens.ProviderRegistry, () => createDefaultRegistry());
  c.register(Tokens.Vault, (x) => new VaultService(x.resolve(Tokens.Storage)));
  c.register(Tokens.License, () => new LicenseService());
  c.register(Tokens.Flags, (x) => new FeatureFlagService(x.resolve(Tokens.Storage), x.resolve(Tokens.License)));
  c.register(Tokens.Compression, (x) => new CompressionService(x.resolve(Tokens.License)));
  // Eagerly load flags so isEnabled() is honest from the first call.
  await c.resolve(Tokens.Flags).load();
  return c;
}
