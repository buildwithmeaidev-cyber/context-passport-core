import { Token } from "./container";
import type { Logger } from "./logger";
import type { ProviderRegistry } from "@/providers/registry";
import type { StorageGateway } from "@/storage/StorageGateway";
import type { ProjectService } from "@/services/project/ProjectService";
import type { ContinuityService } from "@/services/continuity/ContinuityService";
import type { LicenseService } from "@/services/license/LicenseService";
import type { FeatureFlagService } from "@/services/license/FeatureFlagService";
import type { CaptureService } from "@/services/capture/CaptureService";
import type { InjectionService } from "@/services/injection/InjectionService";
import type { IntelligenceService } from "@/services/intelligence/IntelligenceService";
import type { ContextHealthService } from "@/services/intelligence/ContextHealthService";
import type { ProjectMemoryService } from "@/services/intelligence/ProjectMemoryService";
import type { EraseService } from "@/services/privacy/EraseService";

export const Tokens = {
  Logger: new Token<Logger>("Logger"),
  Storage: new Token<StorageGateway>("StorageGateway"),
  ProviderRegistry: new Token<ProviderRegistry>("ProviderRegistry"),
  Projects: new Token<ProjectService>("ProjectService"),
  Continuity: new Token<ContinuityService>("ContinuityService"),
  License: new Token<LicenseService>("LicenseService"),
  Flags: new Token<FeatureFlagService>("FeatureFlagService"),
  Capture: new Token<CaptureService>("CaptureService"),
  Injection: new Token<InjectionService>("InjectionService"),
  Intelligence: new Token<IntelligenceService>("IntelligenceService"),
  Health: new Token<ContextHealthService>("ContextHealthService"),
  Memory: new Token<ProjectMemoryService>("ProjectMemoryService"),
  Erase: new Token<EraseService>("EraseService"),
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
