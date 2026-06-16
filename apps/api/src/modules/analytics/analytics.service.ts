import { Injectable } from "@nestjs/common";
import { computeOverview, computePipelineVelocity, sampleDataset } from "@market-intel/domain";

@Injectable()
export class AnalyticsService {
  getOverview() {
    const overview = computeOverview(sampleDataset);

    return {
      ...overview,
      pipelineVelocityPerDay: Number(computePipelineVelocity(sampleDataset).toFixed(0))
    };
  }

  getFunnel() {
    const overview = computeOverview(sampleDataset);

    return {
      generatedAt: overview.generatedAt,
      funnel: overview.funnel,
      winRate:
        sampleDataset.opportunities.filter((item) => item.stage === "won").length /
        Math.max(sampleDataset.opportunities.length, 1),
      opportunityVelocityDays: 16.5
    };
  }

  getFinanceView() {
    const totalSpend = sampleDataset.spendEvents.reduce((sum, item) => sum + item.amount, 0);
    const totalRevenue = sampleDataset.revenueEvents.reduce((sum, item) => sum + item.amount, 0);

    return {
      totalSpend,
      totalRevenue,
      marginEfficiencyRatio: Number((totalRevenue / Math.max(totalSpend, 1)).toFixed(2)),
      sourcedPipeline: sampleDataset.opportunities.reduce((sum, item) => sum + item.amount, 0),
      spendByPlatform: sampleDataset.campaigns.map((campaign) => ({
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: campaign.platform,
        spend: campaign.spend,
        conversions: campaign.conversions
      }))
    };
  }
}
