import type {
  BrandContextResponse,
  BrandKitResourceSummary,
  BrandKitSummaryResponse,
  ConnectorConnection,
  ConnectorDefinition,
  ConnectorSyncJob,
  DeploymentTarget,
  McpBridgeServiceStatus
} from "./platform-types.js";

export const sampleConnectorDefinitions: ConnectorDefinition[] = [
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    authType: "oauth2",
    runtime: "remote_api",
    description: "Marketing engagement, leads, lifecycle stage, and CRM activity ingestion.",
    supportsWebhooks: true,
    supportsPolling: true,
    supportsMcp: false,
    adminSetupRequired: false,
    requiredEnv: ["HUBSPOT_CLIENT_ID", "HUBSPOT_CLIENT_SECRET", "HUBSPOT_REDIRECT_URI"],
    healthStatus: "healthy"
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "crm",
    authType: "oauth2",
    runtime: "remote_api",
    description: "Pipeline, opportunity, account, and revenue attribution source of truth.",
    supportsWebhooks: true,
    supportsPolling: true,
    supportsMcp: false,
    adminSetupRequired: true,
    requiredEnv: ["SALESFORCE_CLIENT_ID", "SALESFORCE_CLIENT_SECRET", "SALESFORCE_REDIRECT_URI"],
    healthStatus: "degraded"
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    category: "analytics",
    authType: "manual",
    runtime: "remote_api",
    description: "Campaign sessions, UTM trails, landing pages, and attribution touchpoints.",
    supportsWebhooks: false,
    supportsPolling: true,
    supportsMcp: false,
    adminSetupRequired: true,
    requiredEnv: ["GA4_PROPERTY_ID", "GA4_SERVICE_ACCOUNT_JSON"],
    healthStatus: "healthy"
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    category: "ads",
    authType: "manual",
    runtime: "remote_api",
    description: "Ad spend, audience cohorts, and campaign performance ingestion.",
    supportsWebhooks: false,
    supportsPolling: true,
    supportsMcp: false,
    adminSetupRequired: true,
    requiredEnv: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
    healthStatus: "healthy"
  },
  {
    id: "brand_kit_os",
    name: "Brand Kit OS",
    category: "brand",
    authType: "mcp_streamable_http",
    runtime: "remote_mcp",
    description: "Primary brand operations MCP used for brand context, assets, personas, and governance.",
    supportsWebhooks: false,
    supportsPolling: true,
    supportsMcp: true,
    adminSetupRequired: false,
    requiredEnv: ["BRANDKIT_OS_MCP_URL", "BRANDKIT_OS_BEARER_TOKEN"],
    healthStatus: "healthy"
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "deployment",
    authType: "api_key",
    runtime: "remote_api",
    description: "Frontend deployment target and deployment diagnostics surface.",
    supportsWebhooks: true,
    supportsPolling: true,
    supportsMcp: false,
    adminSetupRequired: false,
    requiredEnv: ["VERCEL_TOKEN", "VERCEL_PROJECT_ID"],
    healthStatus: "healthy"
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "deployment",
    authType: "api_key",
    runtime: "remote_api",
    description: "Backend database, auth/session storage, and operational persistence plane.",
    supportsWebhooks: true,
    supportsPolling: true,
    supportsMcp: false,
    adminSetupRequired: false,
    requiredEnv: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    healthStatus: "healthy"
  },
  {
    id: "github",
    name: "GitHub",
    category: "source_control",
    authType: "api_key",
    runtime: "remote_api",
    description: "Repository, CI, workflow, and release management integration.",
    supportsWebhooks: true,
    supportsPolling: true,
    supportsMcp: false,
    adminSetupRequired: false,
    requiredEnv: ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"],
    healthStatus: "healthy"
  },
  {
    id: "market_intel_mcp",
    name: "Market Intel MCP Bridge",
    category: "agent_protocol",
    authType: "mcp_streamable_http",
    runtime: "local_mcp_bridge",
    description: "Local Streamable HTTP bridge server exposing brand, deployment, and connector context to autonomous agents.",
    supportsWebhooks: false,
    supportsPolling: true,
    supportsMcp: true,
    adminSetupRequired: false,
    requiredEnv: ["MARKET_INTEL_MCP_BASE_URL"],
    healthStatus: "healthy"
  }
];

export const sampleConnectorConnections: ConnectorConnection[] = [
  {
    connectorId: "hubspot",
    tenantId: "tenant-acme-growth",
    status: "connected",
    accountLabel: "Acme HubSpot Workspace",
    scopes: ["crm.objects.contacts.read", "oauth", "forms"],
    lastSyncAt: "2026-06-15T17:20:00.000Z",
    freshnessMinutes: 6,
    syncCursor: "hs-2026-06-15T17:20:00.000Z",
    setupInstructions: ["Validate webhook subscriptions for contact and deal changes."],
    webhookUrl: "https://api.marketintel.local/connectors/hubspot/webhook"
  },
  {
    connectorId: "salesforce",
    tenantId: "tenant-acme-growth",
    status: "needs_setup",
    accountLabel: "Customer-managed Salesforce org",
    scopes: ["api", "refresh_token"],
    setupInstructions: [
      "Create Connected App and API user.",
      "Enable Change Data Capture for Account, Contact, Lead, Opportunity, Campaign, and CampaignMember.",
      "Add callback URL from this application before enabling real-time sync."
    ]
  },
  {
    connectorId: "ga4",
    tenantId: "tenant-acme-growth",
    status: "connected",
    accountLabel: "GA4 Property 9153021",
    scopes: ["analytics.readonly"],
    lastSyncAt: "2026-06-15T17:18:00.000Z",
    freshnessMinutes: 8,
    syncCursor: "ga4-9153021:2026-06-15T17:18:00.000Z",
    setupInstructions: ["Rotate service-account credentials through Supabase secrets."],
    webhookUrl: undefined
  },
  {
    connectorId: "meta_ads",
    tenantId: "tenant-acme-growth",
    status: "connected",
    accountLabel: "Acme Meta Ad Account",
    scopes: ["ads_read", "business_management"],
    lastSyncAt: "2026-06-15T17:17:00.000Z",
    freshnessMinutes: 10,
    syncCursor: "meta-act_18291:2026-06-15T17:17:00.000Z",
    setupInstructions: ["Review audience sync write scope before enabling approval-based pushes."],
    webhookUrl: undefined
  },
  {
    connectorId: "brand_kit_os",
    tenantId: "tenant-acme-growth",
    status: "connected",
    accountLabel: "Brand Kit OS MCP",
    scopes: ["brand_kit:read", "knowledge_files:write"],
    lastSyncAt: "2026-06-16T01:45:28.000Z",
    freshnessMinutes: 1,
    syncCursor: "mcp-session:0fe165188c568458f3a2dc578c87d728",
    setupInstructions: ["Use Brand Kit OS as the primary brand context provider for content and workflow agents."]
  },
  {
    connectorId: "vercel",
    tenantId: "tenant-acme-growth",
    status: "needs_setup",
    accountLabel: "Vercel deployment target",
    scopes: ["project.read", "deployment.read"],
    setupInstructions: ["Add VERCEL_TOKEN and VERCEL_PROJECT_ID before enabling deployment diagnostics."]
  },
  {
    connectorId: "supabase",
    tenantId: "tenant-acme-growth",
    status: "needs_setup",
    accountLabel: "Supabase backend",
    scopes: ["service_role"],
    setupInstructions: ["Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for persistence and health checks."]
  },
  {
    connectorId: "github",
    tenantId: "tenant-acme-growth",
    status: "needs_setup",
    accountLabel: "GitHub repository",
    scopes: ["repo", "workflow"],
    setupInstructions: ["Add GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO to enable repository diagnostics."]
  },
  {
    connectorId: "market_intel_mcp",
    tenantId: "tenant-acme-growth",
    status: "connected",
    accountLabel: "Local MCP bridge",
    scopes: ["tools", "resources", "prompts"],
    lastSyncAt: "2026-06-15T17:15:00.000Z",
    freshnessMinutes: 0,
    setupInstructions: ["Expose this server to Codex or other agent runtimes via Streamable HTTP."]
  }
];

export const sampleSyncJobs: ConnectorSyncJob[] = [
  {
    id: "sync-1",
    tenantId: "tenant-acme-growth",
    connectorId: "hubspot",
    mode: "incremental",
    status: "success",
    startedAt: "2026-06-15T17:19:00.000Z",
    completedAt: "2026-06-15T17:20:00.000Z",
    recordsProcessed: 48,
    checkpoint: "hubspot:contacts:1718472000"
  },
  {
    id: "sync-2",
    tenantId: "tenant-acme-growth",
    connectorId: "salesforce",
    mode: "webhook",
    status: "error",
    startedAt: "2026-06-15T17:16:00.000Z",
    completedAt: "2026-06-15T17:16:04.000Z",
    recordsProcessed: 0,
    message: "Salesforce Change Data Capture not yet enabled for the tenant org."
  },
  {
    id: "sync-3",
    tenantId: "tenant-acme-growth",
    connectorId: "brand_kit_os",
    mode: "incremental",
    status: "success",
    startedAt: "2026-06-16T01:45:25.000Z",
    completedAt: "2026-06-16T01:45:28.000Z",
    recordsProcessed: 19,
    checkpoint: "brandkit:resources:19"
  }
];

export const sampleBrandKitResources: BrandKitResourceSummary[] = [
  {
    id: "0315bbb8-e5f3-49de-adf2-9f0bc39d586e",
    uri: "brandkit://0315bbb8-e5f3-49de-adf2-9f0bc39d586e",
    name: "AutoLog — Automatic Changelogs for Vibe Coders",
    description: "Brand kit resource surfaced by the tested Brand Kit OS MCP server.",
    mimeType: "application/json"
  },
  {
    id: "1c1ffd85-f190-46b6-bf52-48fcdc15783c",
    uri: "brandkit://1c1ffd85-f190-46b6-bf52-48fcdc15783c",
    name: "Launch99 - AI-Powered Web Development Agency | Austin, Texas",
    description: "Brand kit resource surfaced by the tested Brand Kit OS MCP server.",
    mimeType: "application/json"
  },
  {
    id: "9d16945f-2bb4-4186-8dde-64afc707db39",
    uri: "brandkit://9d16945f-2bb4-4186-8dde-64afc707db39",
    name: "Brand Kit OS",
    description: "Brand kit resource surfaced by the tested Brand Kit OS MCP server.",
    mimeType: "application/json"
  }
];

export const sampleBrandKitSummary: BrandKitSummaryResponse = {
  brandKitId: "1c1ffd85-f190-46b6-bf52-48fcdc15783c",
  name: "Launch99 - AI-Powered Web Development Agency | Austin, Texas",
  summary:
    "AI-powered web development agency positioned around speed, credible execution, and practical transformation for founder-led teams.",
  source: "brand_kit_os"
};

export const sampleBrandContext: BrandContextResponse = {
  brandKitId: "1c1ffd85-f190-46b6-bf52-48fcdc15783c",
  taskType: "content_creation",
  context:
    "Prioritize confident, execution-oriented language, practical outcomes, and strong clarity around delivery velocity and founder trust.",
  systemPrompt:
    "Write as a pragmatic AI-native development partner. Stay concrete, credible, and outcome-led. Avoid vague futurist language.",
  source: "brand_kit_os"
};

export const sampleDeploymentTargets: DeploymentTarget[] = [
  {
    id: "vercel",
    name: "Vercel",
    connectionType: "api",
    status: "needs_setup",
    summary: "Hosts the Next.js frontend and should surface deployment logs and environment status.",
    requiredEnv: ["VERCEL_TOKEN", "VERCEL_PROJECT_ID"],
    troubleshootingPath: "/docs/deployment/vercel-supabase-github.md"
  },
  {
    id: "supabase",
    name: "Supabase",
    connectionType: "api",
    status: "needs_setup",
    summary: "Stores connector credentials, sync cursors, and operational persistence for the backend.",
    requiredEnv: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    troubleshootingPath: "/docs/deployment/vercel-supabase-github.md"
  },
  {
    id: "github",
    name: "GitHub",
    connectionType: "git",
    status: "needs_setup",
    summary: "Source control and CI entry point for Vercel and Supabase deployment workflows.",
    requiredEnv: ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"],
    troubleshootingPath: "/docs/deployment/vercel-supabase-github.md"
  }
];

export const sampleMcpBridgeStatus: McpBridgeServiceStatus = {
  status: "healthy",
  baseUrl: "http://localhost:4100/mcp",
  streamableHttp: true,
  discoveredTools: 60,
  discoveredResources: 19,
  notes: [
    "Bridge is designed for Streamable HTTP transport.",
    "Brand Kit OS is the primary upstream brand-context MCP provider.",
    "Deployment and connector context are exposed as local tools for autonomous agents."
  ]
};
