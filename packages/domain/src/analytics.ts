import type {
  AnalyticsOverview,
  ChannelMixItem,
  FunnelMetric,
  MarketIntelligenceDataset,
  MetricCard,
  Opportunity,
  Touchpoint
} from "./types.js";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function daysBetween(start: string, end: string): number {
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();

  return Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
}

export function computeChannelMix(dataset: MarketIntelligenceDataset): ChannelMixItem[] {
  const totalSpend = dataset.spendEvents.reduce((sum, item) => sum + item.amount, 0);
  const revenueByCampaign = new Map<string, number>();

  dataset.opportunities
    .filter((opportunity) => opportunity.stage === "won")
    .forEach((opportunity) => {
      const share = opportunity.amount / Math.max(opportunity.influencedCampaignIds.length, 1);
      opportunity.influencedCampaignIds.forEach((campaignId) => {
        revenueByCampaign.set(campaignId, (revenueByCampaign.get(campaignId) ?? 0) + share);
      });
    });

  return dataset.campaigns.map((campaign) => ({
    channel: campaign.channel,
    spend: campaign.spend,
    spendShare: totalSpend === 0 ? 0 : (campaign.spend / totalSpend) * 100,
    revenue: revenueByCampaign.get(campaign.id) ?? 0
  }));
}

export function computeAttributionCoverage(dataset: MarketIntelligenceDataset): number {
  const opportunitiesWithTouchpoints = dataset.opportunities.filter((opportunity) =>
    opportunity.influencedCampaignIds.length > 0
  ).length;

  return (opportunitiesWithTouchpoints / Math.max(dataset.opportunities.length, 1)) * 100;
}

export function findAttributedTouchpoint(
  touchpoints: Touchpoint[],
  opportunity: Opportunity,
  model: "first_touch" | "last_touch"
): Touchpoint | undefined {
  const timeline = touchpoints
    .filter((touchpoint) => touchpoint.organizationId === opportunity.organizationId)
    .sort((left, right) => new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime());

  if (timeline.length === 0) {
    return undefined;
  }

  return model === "first_touch" ? timeline[0] : timeline[timeline.length - 1];
}

export function computeOverview(dataset: MarketIntelligenceDataset): AnalyticsOverview {
  const totalSpend = dataset.spendEvents.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenue = dataset.revenueEvents.reduce((sum, item) => sum + item.amount, 0);
  const customers = dataset.organizations.filter((item) => item.status === "customer");
  const leads = dataset.leads.length;
  const wonOpportunities = dataset.opportunities.filter((item) => item.stage === "won");
  const avgLtv =
    customers.reduce((sum, item) => sum + item.currentLtv, 0) / Math.max(customers.length, 1);
  const cac = totalSpend / Math.max(wonOpportunities.length, 1);
  const cpl = totalSpend / Math.max(leads, 1);
  const roas = totalRevenue / Math.max(totalSpend, 1);
  const mer = totalRevenue / Math.max(totalSpend, 1);
  const monthlyRecurringRevenue =
    dataset.revenueEvents.reduce((sum, item) => sum + item.recurringMonthlyRevenue, 0) /
    Math.max(dataset.revenueEvents.length, 1);
  const paybackMonths = cac / Math.max(monthlyRecurringRevenue, 1);
  const influencedRevenue = dataset.opportunities
    .filter((item) => item.influencedCampaignIds.length > 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const avgSalesCycle =
    wonOpportunities.reduce((sum, item) => sum + daysBetween(item.createdAt, item.closedAt ?? item.createdAt), 0) /
    Math.max(wonOpportunities.length, 1);

  const metrics: MetricCard[] = [
    {
      id: "cac",
      label: "CAC",
      value: formatCurrency(cac),
      trend: "-6.4%",
      status: "good",
      description: "Total spend divided by closed-won customers."
    },
    {
      id: "ltv",
      label: "LTV",
      value: formatCurrency(avgLtv),
      trend: "+8.2%",
      status: "good",
      description: "Average current lifetime value across active customers."
    },
    {
      id: "cpl",
      label: "CPL",
      value: formatCurrency(cpl),
      trend: "-10.1%",
      status: "good",
      description: "Spend divided by newly created leads."
    },
    {
      id: "roas",
      label: "ROAS / MER",
      value: `${roas.toFixed(2)}x`,
      trend: "+0.3x",
      status: "good",
      description: `Blended media efficiency ratio is ${mer.toFixed(2)}x.`
    },
    {
      id: "pipeline-sourced",
      label: "Pipeline Sourced",
      value: formatCurrency(influencedRevenue),
      trend: "+12.0%",
      status: "good",
      description: "Revenue opportunities with at least one attributable campaign touch."
    },
    {
      id: "payback",
      label: "Payback Period",
      value: `${paybackMonths.toFixed(1)} mo`,
      trend: "-0.5 mo",
      status: paybackMonths <= 3 ? "good" : "watch",
      description: "CAC divided by average monthly recurring revenue."
    }
  ];

  const funnel: FunnelMetric[] = [
    {
      label: "Leads",
      value: dataset.leads.length
    },
    {
      label: "Qualified",
      value: dataset.leads.filter((item) => item.status === "qualified").length,
      conversionRate:
        (dataset.leads.filter((item) => item.status === "qualified").length / Math.max(dataset.leads.length, 1)) *
        100
    },
    {
      label: "Open Opportunities",
      value: dataset.opportunities.filter((item) => item.stage !== "lost").length,
      conversionRate:
        (dataset.opportunities.filter((item) => item.stage !== "lost").length / Math.max(dataset.leads.length, 1)) *
        100
    },
    {
      label: "Won",
      value: wonOpportunities.length,
      conversionRate: (wonOpportunities.length / Math.max(dataset.opportunities.length, 1)) * 100
    }
  ];

  const freshestLag = Math.max(...dataset.integrations.map((item) => item.freshnessMinutes));
  const syncFailuresLast24h = dataset.integrations.filter((item) => item.status !== "healthy").length;

  return {
    generatedAt: "2026-06-14T18:10:00.000Z",
    metrics,
    channelMix: computeChannelMix(dataset),
    funnel: funnel.map((item) => ({
      ...item,
      conversionRate: item.conversionRate ? Number(formatPercent(item.conversionRate).replace("%", "")) : undefined
    })),
    dataFreshnessMinutes: freshestLag,
    syncFailuresLast24h,
    attributionCoverage: computeAttributionCoverage(dataset)
  };
}

export function computePipelineVelocity(dataset: MarketIntelligenceDataset): number {
  const wonOpportunities = dataset.opportunities.filter((item) => item.stage === "won");
  const avgDealSize =
    wonOpportunities.reduce((sum, item) => sum + item.amount, 0) / Math.max(wonOpportunities.length, 1);
  const winRate = wonOpportunities.length / Math.max(dataset.opportunities.length, 1);
  const cycleLength =
    wonOpportunities.reduce((sum, item) => sum + daysBetween(item.createdAt, item.closedAt ?? item.createdAt), 0) /
    Math.max(wonOpportunities.length, 1);

  return (dataset.opportunities.length * avgDealSize * winRate) / Math.max(cycleLength, 1);
}
