import { Token } from "./container";
import type { Logger } from "./logger";
import type { ProviderRegistry } from "@/providers/registry";
import type { StorageGateway } from "@/storage/StorageGateway";
import type { VaultService } from "@/services/vault/VaultService";
import type { CompressionService } from "@/services/compression/CompressionService";
import type { LicenseService } from "@/services/license/LicenseService";
import type { FeatureFlagService } from "@/services/license/FeatureFlagService";
import type { CaptureService } from "@/services/capture/CaptureService";
import type { InjectionService } from "@/services/injection/InjectionService";

export const Tokens = {
  Logger: new Token<Logger>("Logger"),
  Storage: new Token<StorageGateway>("StorageGateway"),
  ProviderRegistry: new Token<ProviderRegistry>("ProviderRegistry"),
  Vault: new Token<VaultService>("VaultService"),
  Compression: new Token<CompressionService>("CompressionService"),
  License: new Token<LicenseService>("LicenseService"),
  Flags: new Token<FeatureFlagService>("FeatureFlagService"),
  Capture: new Token<CaptureService>("CaptureService"),
  Injection: new Token<InjectionService>("InjectionService"),
} as const;

export interface ConversationTurn {
  role: "user" | "assistant" | "system";
  text: string;
}

export interface CapturedConversation {
  providerId: string;
  url: string;
  title: string;
  turns: ConversationTurn[];
  capturedAt: number;
}
