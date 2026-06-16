import type { IntegrationKey, SyncStatus } from "./types.js";

export type ConnectorCategory =
  | "crm"
  | "analytics"
  | "ads"
  | "brand"
  | "deployment"
  | "source_control"
  | "agent_protocol";

export type ConnectorAuthType = "oauth2" | "manual" | "api_key" | "mcp_streamable_http";
export type ConnectorRuntime = "remote_api" | "remote_mcp" | "local_mcp_bridge";
export type ConnectorConnectionStatus =
  | "connected"
  | "disconnected"
  | "needs_setup"
  | "degraded"
  | "error";
export type ConnectorSyncJobMode = "initial_backfill" | "incremental" | "webhook";
export type ConnectorSyncJobStatus = "queued" | "running" | "success" | "error";
export type BrandContextTaskType =
  | "content_creation"
  | "voice_check"
  | "campaign_planning"
  | "product_messaging"
  | "persona_embodiment"
  | "competitive_analysis";

export interface ConnectorDefinition {
  id: IntegrationKey;
  name: string;
  category: ConnectorCategory;
  authType: ConnectorAuthType;
  runtime: ConnectorRuntime;
  description: string;
  supportsWebhooks: boolean;
  supportsPolling: boolean;
  supportsMcp: boolean;
  adminSetupRequired: boolean;
  requiredEnv: string[];
  healthStatus: SyncStatus;
}

export interface ConnectorConnection {
  connectorId: IntegrationKey;
  tenantId: string;
  status: ConnectorConnectionStatus;
  accountLabel: string;
  scopes: string[];
  lastSyncAt?: string;
  freshnessMinutes?: number;
  syncCursor?: string;
  setupInstructions: string[];
  webhookUrl?: string;
}

export interface ConnectorAuthSession {
  sessionId: string;
  tenantId: string;
  connectorId: IntegrationKey;
  authUrl: string;
  redirectUri: string;
  state: string;
  codeVerifier?: string;
  createdAt: string;
  expiresAt: string;
}

export interface ConnectorTokenExchangeResult {
  connectorId: IntegrationKey;
  connected: boolean;
  accountLabel: string;
  scopes: string[];
  expiresAt?: string;
  message: string;
}

export interface ConnectorSyncJob {
  id: string;
  tenantId: string;
  connectorId: IntegrationKey;
  mode: ConnectorSyncJobMode;
  status: ConnectorSyncJobStatus;
  startedAt: string;
  completedAt?: string;
  recordsProcessed?: number;
  checkpoint?: string;
  message?: string;
}

export interface BrandKitResourceSummary {
  id: string;
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface BrandKitSummaryResponse {
  brandKitId: string;
  name: string;
  summary: string;
  source: "brand_kit_os";
}

export interface BrandContextResponse {
  brandKitId: string;
  taskType: BrandContextTaskType;
  personaName?: string;
  context: string;
  systemPrompt?: string;
  source: "brand_kit_os";
}

export interface DeploymentTarget {
  id: "vercel" | "supabase" | "github";
  name: string;
  connectionType: "api" | "mcp" | "git";
  status: ConnectorConnectionStatus;
  summary: string;
  requiredEnv: string[];
  troubleshootingPath?: string;
}

export interface McpBridgeServiceStatus {
  status: "healthy" | "degraded" | "offline";
  baseUrl: string;
  streamableHttp: boolean;
  discoveredTools: number;
  discoveredResources: number;
  notes: string[];
}
