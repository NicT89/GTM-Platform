import { Injectable } from "@nestjs/common";
import type {
  ConnectorAuthSession,
  ConnectorConnection,
  ConnectorSyncJob,
  ConnectorTokenExchangeResult,
  IntegrationKey
} from "@market-intel/domain";
import { sampleConnectorConnections, sampleSyncJobs } from "@market-intel/domain";
import { SupabaseService } from "../../common/supabase.service";

interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  instanceUrl?: string;
  scopes: string[];
  expiresAt?: string;
}

@Injectable()
export class ConnectorsStore {
  private readonly connections = new Map<IntegrationKey, ConnectorConnection>(
    sampleConnectorConnections.map((connection) => [connection.connectorId, connection])
  );
  private readonly syncJobs = new Map<string, ConnectorSyncJob>(sampleSyncJobs.map((job) => [job.id, job]));
  private readonly authSessions = new Map<string, ConnectorAuthSession>();
  private readonly tokens = new Map<IntegrationKey, StoredToken>();

  constructor(private readonly supabaseService: SupabaseService) {}

  async listConnections(): Promise<ConnectorConnection[]> {
    return Array.from(this.connections.values());
  }

  async getConnection(connectorId: IntegrationKey): Promise<ConnectorConnection | undefined> {
    return this.connections.get(connectorId);
  }

  async upsertConnection(connection: ConnectorConnection): Promise<ConnectorConnection> {
    this.connections.set(connection.connectorId, connection);

    if (this.supabaseService.isEnabled()) {
      const client = this.supabaseService.getClient();

      try {
        await client?.from("tenant_connectors").upsert({
          tenant_id: connection.tenantId,
          connector_id: connection.connectorId,
          status: connection.status,
          account_label: connection.accountLabel,
          scopes: connection.scopes,
          last_sync_at: connection.lastSyncAt ?? null,
          freshness_minutes: connection.freshnessMinutes ?? null,
          sync_cursor: connection.syncCursor ?? null,
          setup_instructions: connection.setupInstructions,
          webhook_url: connection.webhookUrl ?? null
        });
      } catch {
        // Allow local development to continue even if Supabase tables are not provisioned yet.
      }
    }

    return connection;
  }

  async listSyncJobs(connectorId?: IntegrationKey): Promise<ConnectorSyncJob[]> {
    const jobs = Array.from(this.syncJobs.values()).sort((left, right) => right.startedAt.localeCompare(left.startedAt));

    return connectorId ? jobs.filter((job) => job.connectorId === connectorId) : jobs;
  }

  async appendSyncJob(job: ConnectorSyncJob): Promise<ConnectorSyncJob> {
    this.syncJobs.set(job.id, job);

    if (this.supabaseService.isEnabled()) {
      const client = this.supabaseService.getClient();

      try {
        await client?.from("connector_sync_jobs").upsert({
          id: job.id,
          tenant_id: job.tenantId,
          connector_id: job.connectorId,
          mode: job.mode,
          status: job.status,
          started_at: job.startedAt,
          completed_at: job.completedAt ?? null,
          records_processed: job.recordsProcessed ?? null,
          checkpoint: job.checkpoint ?? null,
          message: job.message ?? null
        });
      } catch {
        // Allow local development to continue even if Supabase tables are not provisioned yet.
      }
    }

    return job;
  }

  async saveAuthSession(session: ConnectorAuthSession): Promise<ConnectorAuthSession> {
    this.authSessions.set(session.sessionId, session);

    if (this.supabaseService.isEnabled()) {
      const client = this.supabaseService.getClient();

      try {
        await client?.from("connector_auth_sessions").upsert({
          id: session.sessionId,
          tenant_id: session.tenantId,
          connector_id: session.connectorId,
          auth_url: session.authUrl,
          redirect_uri: session.redirectUri,
          state: session.state,
          code_verifier: session.codeVerifier ?? null,
          created_at: session.createdAt,
          expires_at: session.expiresAt
        });
      } catch {
        // Allow local development to continue even if Supabase tables are not provisioned yet.
      }
    }

    return session;
  }

  getAuthSession(sessionId: string): ConnectorAuthSession | undefined {
    return this.authSessions.get(sessionId);
  }

  deleteAuthSession(sessionId: string): void {
    this.authSessions.delete(sessionId);
  }

  async saveToken(
    connectorId: IntegrationKey,
    token: StoredToken,
    exchange: ConnectorTokenExchangeResult,
    tenantId: string
  ): Promise<void> {
    this.tokens.set(connectorId, token);

    await this.upsertConnection({
      connectorId,
      tenantId,
      status: "connected",
      accountLabel: exchange.accountLabel,
      scopes: exchange.scopes,
      lastSyncAt: new Date().toISOString(),
      freshnessMinutes: 0,
      syncCursor: `auth:${new Date().toISOString()}`,
      setupInstructions: ["Credential exchange completed successfully."]
    });

    if (this.supabaseService.isEnabled()) {
      const client = this.supabaseService.getClient();

      try {
        await client?.from("connector_credentials").upsert({
          connector_id: connectorId,
          tenant_id: tenantId,
          access_token: token.accessToken,
          refresh_token: token.refreshToken ?? null,
          instance_url: token.instanceUrl ?? null,
          scopes: token.scopes,
          expires_at: token.expiresAt ?? null
        });
      } catch {
        // Allow local development to continue even if Supabase tables are not provisioned yet.
      }
    }
  }

  getToken(connectorId: IntegrationKey): StoredToken | undefined {
    return this.tokens.get(connectorId);
  }
}
