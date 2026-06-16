import { Injectable, NotFoundException } from "@nestjs/common";
import { connectorAuthLabels, connectorBlueprint, connectorRuntimeLabels } from "@market-intel/config";
import type {
  BrandContextTaskType,
  ConnectorAuthSession,
  ConnectorConnection,
  ConnectorConnectionStatus,
  ConnectorSyncJob,
  ConnectorTokenExchangeResult,
  IntegrationKey
} from "@market-intel/domain";
import {
  sampleConnectorDefinitions,
  sampleMcpBridgeStatus,
  sampleSyncJobs
} from "@market-intel/domain";
import { randomUUID } from "node:crypto";
import { DeploymentsService } from "../deployments/deployments.service";
import { BrandKitOsClient } from "./brand-kit-os.client";
import { ConnectorsStore } from "./connectors.store";

const defaultTenantId = "tenant-acme-growth";

@Injectable()
export class ConnectorsService {
  constructor(
    private readonly connectorsStore: ConnectorsStore,
    private readonly brandKitOsClient: BrandKitOsClient,
    private readonly deploymentsService: DeploymentsService
  ) {}

  async listConnectors() {
    const connections = await this.connectorsStore.listConnections();
    const brandKitStatus = await this.brandKitOsClient.getStatus();
    const deploymentTargets = await this.deploymentsService.listTargets();

    return {
      blueprint: connectorBlueprint,
      connectors: sampleConnectorDefinitions.map((definition) => {
        const connection =
          this.resolveDeploymentConnection(definition.id, deploymentTargets) ??
          connections.find((item) => item.connectorId === definition.id);

        return {
          ...definition,
          connection,
          authLabel: connectorAuthLabels[definition.authType],
          runtimeLabel: connectorRuntimeLabels[definition.runtime],
          testedMcpStatus: definition.id === "brand_kit_os" ? brandKitStatus : undefined
        };
      }),
      deployments: deploymentTargets,
      mcpBridge: sampleMcpBridgeStatus
    };
  }

  async getConnector(connectorId: string) {
    const definition = this.getDefinition(connectorId as IntegrationKey);
    const deploymentTargets = await this.deploymentsService.listTargets();
    const connection =
      this.resolveDeploymentConnection(definition.id, deploymentTargets) ??
      (await this.connectorsStore.getConnection(definition.id));
    const jobs = await this.listSyncJobs(definition.id);

    return {
      ...definition,
      connection,
      syncJobs: jobs,
      contract: connectorBlueprint,
      authLabel: connectorAuthLabels[definition.authType],
      runtimeLabel: connectorRuntimeLabels[definition.runtime],
      recommendedCadence:
        definition.id === "salesforce"
          ? "Salesforce CDC + 5 minute fallback poll"
          : definition.id === "brand_kit_os"
            ? "Streamable HTTP MCP initialize + resource/tool discovery on demand"
            : "Webhook or 5 minute poll",
      setupNotes:
        definition.id === "salesforce"
          ? "Requires customer-managed Connected App, API user, and optional CDC/event delivery."
          : definition.id === "brand_kit_os"
            ? "Uses Streamable HTTP MCP and bearer-based autonomous access, not user OAuth."
            : "Supports tenant-scoped health checks and sync orchestration."
    };
  }

  async startAuth(connectorId: IntegrationKey, tenantId = defaultTenantId, redirectUri?: string) {
    const definition = this.getDefinition(connectorId);

    if (definition.authType !== "oauth2") {
      return {
        connectorId,
        mode: definition.authType,
        setupInstructions: (await this.connectorsStore.getConnection(connectorId))?.setupInstructions ?? [],
        requiredEnv: definition.requiredEnv
      };
    }

    const state = randomUUID();
    const sessionId = randomUUID();
    const resolvedRedirectUri = redirectUri ?? this.resolveRedirectUri(connectorId);
    const authUrl = this.buildAuthorizeUrl(connectorId, resolvedRedirectUri, state);
    const session: ConnectorAuthSession = {
      sessionId,
      tenantId,
      connectorId,
      authUrl,
      redirectUri: resolvedRedirectUri,
      state,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    await this.connectorsStore.saveAuthSession(session);

    return session;
  }

  async finishAuth(
    connectorId: IntegrationKey,
    code: string,
    sessionId: string,
    tenantId = defaultTenantId
  ): Promise<ConnectorTokenExchangeResult> {
    const session = this.connectorsStore.getAuthSession(sessionId);

    if (!session || session.connectorId !== connectorId) {
      throw new NotFoundException(`Auth session ${sessionId} was not found for ${connectorId}.`);
    }

    let exchange: ConnectorTokenExchangeResult;

    if (connectorId === "hubspot") {
      exchange = await this.exchangeHubSpotCode(code, session.redirectUri);
    } else if (connectorId === "salesforce") {
      exchange = await this.exchangeSalesforceCode(code, session.redirectUri);
    } else {
      throw new NotFoundException(`Connector ${connectorId} does not support OAuth callback exchange.`);
    }

    this.connectorsStore.deleteAuthSession(sessionId);

    return {
      ...exchange,
      message: `${exchange.accountLabel} connected successfully.`
    };
  }

  async queueSync(
    connectorId: IntegrationKey,
    mode: "initial_backfill" | "incremental" | "webhook" = "incremental",
    tenantId = defaultTenantId
  ) {
    const definition = this.getDefinition(connectorId);
    const startedAt = new Date().toISOString();
    const baseJob: ConnectorSyncJob = {
      id: randomUUID(),
      connectorId,
      tenantId,
      mode,
      status: "running",
      startedAt
    };

    await this.connectorsStore.appendSyncJob(baseJob);

    const completedJob = await this.runSync(baseJob, definition.name);
    await this.connectorsStore.appendSyncJob(completedJob);

    return completedJob;
  }

  async acceptWebhook(connectorId: IntegrationKey, payload: Record<string, unknown>) {
    const job: ConnectorSyncJob = {
      id: randomUUID(),
      connectorId,
      tenantId: defaultTenantId,
      mode: "webhook",
      status: "success",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      recordsProcessed: Array.isArray(payload.records) ? payload.records.length : 1,
      message: `Webhook received for ${connectorId}.`
    };

    await this.connectorsStore.appendSyncJob(job);

    return {
      accepted: true,
      connectorId,
      observedKeys: Object.keys(payload),
      job
    };
  }

  async listSyncJobs(connectorId?: IntegrationKey) {
    return this.connectorsStore.listSyncJobs(connectorId);
  }

  async listBrandKitResources() {
    const resources = await this.brandKitOsClient.listResources();
    const status = await this.brandKitOsClient.getStatus();

    return {
      status,
      items: resources
    };
  }

  async getBrandKitSummary(brandKitId: string) {
    return this.brandKitOsClient.getBrandKitSummary(brandKitId);
  }

  async getBrandContext(brandKitId: string, taskType: BrandContextTaskType, personaName?: string) {
    return this.brandKitOsClient.getBrandContext(brandKitId, taskType, personaName);
  }

  private getDefinition(connectorId: IntegrationKey) {
    const definition = sampleConnectorDefinitions.find((item) => item.id === connectorId);

    if (!definition) {
      throw new NotFoundException(`Connector ${connectorId} was not found.`);
    }

    return definition;
  }

  private resolveRedirectUri(connectorId: IntegrationKey): string {
    if (connectorId === "hubspot") {
      return process.env.HUBSPOT_REDIRECT_URI ?? "http://127.0.0.1:4000/connectors/hubspot/callback";
    }

    if (connectorId === "salesforce") {
      return process.env.SALESFORCE_REDIRECT_URI ?? "http://127.0.0.1:4000/connectors/salesforce/callback";
    }

    return "http://127.0.0.1:4000/connectors/callback";
  }

  private resolveDeploymentConnection(
    connectorId: IntegrationKey,
    deploymentTargets: Array<{
      id: "vercel" | "supabase" | "github";
      status: ConnectorConnectionStatus;
      name: string;
      checkedAt: string;
      details: string[];
      summary: string;
      configured: boolean;
    }>
  ): ConnectorConnection | undefined {
    if (!["vercel", "supabase", "github"].includes(connectorId)) {
      return undefined;
    }

    const target = deploymentTargets.find((item) => item.id === connectorId);

    if (!target) {
      return undefined;
    }

    return {
      connectorId,
      tenantId: defaultTenantId,
      status: target.status,
      accountLabel: target.summary,
      scopes: [],
      lastSyncAt: target.checkedAt,
      freshnessMinutes: 0,
      syncCursor: `deployment:${target.checkedAt}`,
      setupInstructions: target.details.length > 0 ? target.details : ["No additional deployment details were returned."],
      webhookUrl: undefined
    };
  }

  private buildAuthorizeUrl(connectorId: IntegrationKey, redirectUri: string, state: string): string {
    if (connectorId === "hubspot") {
      const clientId = process.env.HUBSPOT_CLIENT_ID ?? "missing-hubspot-client-id";
      const scopes = [
        "crm.objects.contacts.read",
        "crm.objects.companies.read",
        "crm.objects.deals.read",
        "oauth"
      ].join(" ");

      return `https://app.hubspot.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;
    }

    const clientId = process.env.SALESFORCE_CLIENT_ID ?? "missing-salesforce-client-id";
    const authBase = process.env.SALESFORCE_AUTH_BASE_URL ?? "https://login.salesforce.com";
    const scopes = "api refresh_token offline_access";

    return `${authBase}/services/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;
  }

  private async exchangeHubSpotCode(code: string, redirectUri: string): Promise<ConnectorTokenExchangeResult> {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        connectorId: "hubspot",
        connected: false,
        accountLabel: "HubSpot credentials missing",
        scopes: [],
        message: "HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET are required."
      };
    }

    const response = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code
      })
    });

    if (!response.ok) {
      const errorText = await response.text();

      return {
        connectorId: "hubspot",
        connected: false,
        accountLabel: "HubSpot token exchange failed",
        scopes: [],
        message: errorText
      };
    }

    const payload = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    const scopes = (payload.scope ?? "").split(" ").filter(Boolean);
    const expiresAt = payload.expires_in
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : undefined;

    const exchange: ConnectorTokenExchangeResult = {
      connectorId: "hubspot",
      connected: true,
      accountLabel: "HubSpot workspace",
      scopes,
      expiresAt,
      message: "HubSpot connected successfully."
    };

    await this.connectorsStore.saveToken(
      "hubspot",
      {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        scopes,
        expiresAt
      },
      exchange,
      defaultTenantId
    );

    return exchange;
  }

  private async exchangeSalesforceCode(code: string, redirectUri: string): Promise<ConnectorTokenExchangeResult> {
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const authBase = process.env.SALESFORCE_AUTH_BASE_URL ?? "https://login.salesforce.com";

    if (!clientId || !clientSecret) {
      return {
        connectorId: "salesforce",
        connected: false,
        accountLabel: "Salesforce credentials missing",
        scopes: [],
        message: "SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET are required."
      };
    }

    const response = await fetch(`${authBase}/services/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code
      })
    });

    if (!response.ok) {
      const errorText = await response.text();

      return {
        connectorId: "salesforce",
        connected: false,
        accountLabel: "Salesforce token exchange failed",
        scopes: [],
        message: errorText
      };
    }

    const payload = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      instance_url?: string;
      scope?: string;
    };

    const scopes = (payload.scope ?? "api").split(" ").filter(Boolean);
    const exchange: ConnectorTokenExchangeResult = {
      connectorId: "salesforce",
      connected: true,
      accountLabel: payload.instance_url ?? "Salesforce org",
      scopes,
      message: "Salesforce connected successfully."
    };

    await this.connectorsStore.saveToken(
      "salesforce",
      {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        instanceUrl: payload.instance_url,
        scopes
      },
      exchange,
      defaultTenantId
    );

    return exchange;
  }

  private async runSync(job: ConnectorSyncJob, displayName: string): Promise<ConnectorSyncJob> {
    try {
      if (job.connectorId === "hubspot") {
        return this.syncHubSpot(job, displayName);
      }

      if (job.connectorId === "salesforce") {
        return this.syncSalesforce(job, displayName);
      }

      if (job.connectorId === "brand_kit_os") {
        const resources = await this.brandKitOsClient.listResources();

        return {
          ...job,
          status: "success",
          completedAt: new Date().toISOString(),
          recordsProcessed: resources.length,
          checkpoint: `brandkit:${resources.length}`,
          message: `Loaded ${resources.length} Brand Kit OS resources.`
        };
      }

      return {
        ...job,
        status: "success",
        completedAt: new Date().toISOString(),
        recordsProcessed: 0,
        message: `${displayName} sync was queued but requires platform credentials or admin setup to fetch live records.`
      };
    } catch (error) {
      return {
        ...job,
        status: "error",
        completedAt: new Date().toISOString(),
        recordsProcessed: 0,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async syncHubSpot(job: ConnectorSyncJob, displayName: string): Promise<ConnectorSyncJob> {
    const token = this.connectorsStore.getToken("hubspot");

    if (!token?.accessToken) {
      return {
        ...job,
        status: "error",
        completedAt: new Date().toISOString(),
        recordsProcessed: 0,
        message: `${displayName} sync requires a completed OAuth exchange.`
      };
    }

    const response = await fetch("https://api.hubapi.com/crm/v3/objects/companies?limit=50", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HubSpot sync failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as { results?: Array<unknown> };

    await this.updateConnectionSyncState("hubspot", payload.results?.length ?? 0);

    return {
      ...job,
      status: "success",
      completedAt: new Date().toISOString(),
      recordsProcessed: payload.results?.length ?? 0,
      checkpoint: `hubspot:${Date.now()}`,
      message: `Fetched ${payload.results?.length ?? 0} HubSpot company records.`
    };
  }

  private async syncSalesforce(job: ConnectorSyncJob, displayName: string): Promise<ConnectorSyncJob> {
    const token = this.connectorsStore.getToken("salesforce");

    if (!token?.accessToken || !token.instanceUrl) {
      return {
        ...job,
        status: "error",
        completedAt: new Date().toISOString(),
        recordsProcessed: 0,
        message: `${displayName} sync requires OAuth plus an instance URL from the token exchange.`
      };
    }

    const query = encodeURIComponent("SELECT Id, Name, Industry FROM Account LIMIT 50");
    const response = await fetch(`${token.instanceUrl}/services/data/v61.0/query?q=${query}`, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Salesforce sync failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as { records?: Array<unknown> };

    await this.updateConnectionSyncState("salesforce", payload.records?.length ?? 0);

    return {
      ...job,
      status: "success",
      completedAt: new Date().toISOString(),
      recordsProcessed: payload.records?.length ?? 0,
      checkpoint: `salesforce:${Date.now()}`,
      message: `Fetched ${payload.records?.length ?? 0} Salesforce account records.`
    };
  }

  private async updateConnectionSyncState(connectorId: IntegrationKey, recordsProcessed: number) {
    const existing = await this.connectorsStore.getConnection(connectorId);

    if (!existing) {
      return;
    }

    const next: ConnectorConnection = {
      ...existing,
      status: "connected",
      lastSyncAt: new Date().toISOString(),
      freshnessMinutes: 0,
      syncCursor: `${connectorId}:${Date.now()}`,
      setupInstructions: [
        ...existing.setupInstructions,
        `Last successful live sync processed ${recordsProcessed} records.`
      ].slice(-3)
    };

    await this.connectorsStore.upsertConnection(next);
  }
}
