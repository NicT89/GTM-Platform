import { connectorBlueprint, coreServiceBoundaries, platformPhases } from "@market-intel/config";
import {
  buildOrganizationProfile,
  computeOverview,
  generateInsights,
  sampleBrandContext,
  sampleBrandKitResources,
  sampleBrandKitSummary,
  sampleConnectorConnections,
  sampleConnectorDefinitions,
  sampleDeploymentTargets,
  sampleMcpBridgeStatus,
  sampleDataset,
  sampleSyncJobs,
  sampleRecommendations
} from "@market-intel/domain";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getDashboardData() {
  const overviewFallback = {
    ...computeOverview(sampleDataset),
    pipelineVelocityPerDay: 7906
  };

  const attributionFallback = {
    coverage: "3/3",
    rows: sampleDataset.opportunities.map((opportunity) => ({
      opportunityId: opportunity.id,
      amount: opportunity.amount,
      stage: opportunity.stage,
      firstTouchCampaignId: opportunity.influencedCampaignIds[0] ?? null,
      lastTouchCampaignId: opportunity.influencedCampaignIds[opportunity.influencedCampaignIds.length - 1] ?? null
    }))
  };

  const financeFallback = {
    totalSpend: sampleDataset.spendEvents.reduce((sum, item) => sum + item.amount, 0),
    totalRevenue: sampleDataset.revenueEvents.reduce((sum, item) => sum + item.amount, 0),
    marginEfficiencyRatio: 4.36,
    sourcedPipeline: sampleDataset.opportunities.reduce((sum, item) => sum + item.amount, 0),
    spendByPlatform: sampleDataset.campaigns.map((campaign) => ({
      campaignId: campaign.id,
      campaignName: campaign.name,
      platform: campaign.platform,
      spend: campaign.spend,
      conversions: campaign.conversions
    }))
  };

  const [
    overview,
    connectors,
    insights,
    profile,
    actions,
    attribution,
    finance,
    health,
    policy,
    brandKitResources,
    brandKitSummary,
    brandKitContext,
    hubspotSyncJobs,
    salesforceSyncJobs,
    brandKitSyncJobs
  ] = await Promise.all([
    fetchJson("/analytics/overview", overviewFallback),
    fetchJson("/connectors", {
      blueprint: connectorBlueprint,
      connectors: sampleConnectorDefinitions.map((definition) => ({
        ...definition,
        connection: sampleConnectorConnections.find((item) => item.connectorId === definition.id) ?? null,
        authLabel: definition.authType,
        runtimeLabel: definition.runtime
      })),
      deployments: sampleDeploymentTargets,
      mcpBridge: sampleMcpBridgeStatus
    }),
    fetchJson("/insights", {
      generatedAt: new Date().toISOString(),
      items: generateInsights(sampleDataset)
    }),
    fetchJson("/profiles/org-northstar", buildOrganizationProfile("org-northstar")),
    fetchJson("/actions/recommendations", {
      generatedAt: new Date().toISOString(),
      items: sampleRecommendations
    }),
    fetchJson("/attribution", attributionFallback),
    fetchJson("/analytics/finance", financeFallback),
    fetchJson("/health", {
      status: "ok",
      generatedAt: new Date().toISOString(),
      tenant: sampleDataset.tenant.name,
      freshnessSlaMinutes: sampleDataset.tenant.freshnessSlaMinutes,
      integrations: sampleDataset.integrations
    }),
    fetchJson(`/tenants/${sampleDataset.tenant.id}/policy`, sampleDataset.tenant.policy),
    fetchJson("/connectors/brand-kit-os/resources", {
      status: sampleMcpBridgeStatus,
      items: sampleBrandKitResources
    }),
    fetchJson(`/connectors/brand-kit-os/summary/${sampleBrandKitSummary.brandKitId}`, sampleBrandKitSummary),
    fetchJson(
      `/connectors/brand-kit-os/context/${sampleBrandKitSummary.brandKitId}?taskType=content_creation`,
      sampleBrandContext
    ),
    fetchJson("/connectors/hubspot/sync-jobs", sampleSyncJobs.filter((job) => job.connectorId === "hubspot")),
    fetchJson(
      "/connectors/salesforce/sync-jobs",
      sampleSyncJobs.filter((job) => job.connectorId === "salesforce")
    ),
    fetchJson(
      "/connectors/brand_kit_os/sync-jobs",
      sampleSyncJobs.filter((job) => job.connectorId === "brand_kit_os")
    )
  ]);

  return {
    overview,
    connectors,
    insights,
    profile,
    actions,
    attribution,
    finance,
    health,
    policy,
    brandKit: {
      resources: brandKitResources,
      summary: brandKitSummary,
      context: brandKitContext
    },
    syncJobs: {
      hubspot: hubspotSyncJobs,
      salesforce: salesforceSyncJobs,
      brandKit: brandKitSyncJobs
    },
    phases: platformPhases,
    boundaries: coreServiceBoundaries,
    connectorFallbacks: {
      definitions: sampleConnectorDefinitions,
      connections: sampleConnectorConnections,
      deployments: sampleDeploymentTargets
    }
  };
}
