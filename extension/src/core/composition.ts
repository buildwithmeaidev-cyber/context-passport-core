import { Container } from "@/core/container";
import { ConsoleLogger } from "@/core/logger";
import { Tokens } from "@/core/tokens";
import { ChromeLocalDriver, StorageGateway } from "@/storage";
import { createDefaultRegistry } from "@/providers/registry";
import { ProjectService } from "@/services/project/ProjectService";
import { LicenseService } from "@/services/license/LicenseService";
import { FeatureFlagService } from "@/services/license/FeatureFlagService";
import { ContinuityService } from "@/services/continuity/ContinuityService";
import { IntelligenceService } from "@/services/intelligence/IntelligenceService";
import { ContextHealthService } from "@/services/intelligence/ContextHealthService";
import { ProjectMemoryService } from "@/services/intelligence/ProjectMemoryService";
import { EraseService } from "@/services/privacy/EraseService";

export async function buildContainer(scope: string): Promise<Container> {
  const c = new Container();
  const driver = new ChromeLocalDriver();
  c.register(Tokens.Logger, () => new ConsoleLogger(scope));
  c.register(Tokens.Storage, (x) => new StorageGateway(driver, x.resolve(Tokens.Logger)));
  c.register(Tokens.ProviderRegistry, () => createDefaultRegistry());
  c.register(Tokens.Intelligence, () => new IntelligenceService());
  c.register(Tokens.License, () => new LicenseService());
  c.register(Tokens.Flags, (x) => new FeatureFlagService(x.resolve(Tokens.Storage), x.resolve(Tokens.License)));
  c.register(Tokens.Projects, (x) => new ProjectService(x.resolve(Tokens.Storage), x.resolve(Tokens.Intelligence), x.resolve(Tokens.Flags)));
  c.register(Tokens.Continuity, (x) => new ContinuityService(x.resolve(Tokens.License)));
  c.register(Tokens.Health, () => new ContextHealthService());
  c.register(Tokens.Memory, (x) => new ProjectMemoryService(x.resolve(Tokens.Storage)));
  c.register(Tokens.Erase, (x) => new EraseService(x.resolve(Tokens.Storage), driver, x.resolve(Tokens.Logger)));
  await c.resolve(Tokens.Flags).load();
  return c;
}
