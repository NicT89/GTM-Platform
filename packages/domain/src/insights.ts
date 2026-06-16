import { computeOverview, computePipelineVelocity } from "./analytics.js";
import { sampleInsights } from "./fixtures.js";
import type { InsightCard, MarketIntelligenceDataset } from "./types.js";

export function generateInsights(dataset: MarketIntelligenceDataset): InsightCard[] {
  const overview = computeOverview(dataset);
  const pipelineVelocity = computePipelineVelocity(dataset);
  const dynamicInsights: InsightCard[] = [];

  if (overview.dataFreshnessMinutes >= dataset.tenant.freshnessSlaMinutes - 4) {
    dynamicInsights.push({
      id: "freshness-near-sla",
      title: "Freshness is approaching the SLA ceiling",
      severity: "warning",
      summary: `Current data lag is ${overview.dataFreshnessMinutes} minutes.`,
      impact: "Leadership decisions may begin to outpace attribution confidence if ingestion slows further.",
      recommendedAction: "Review webhook delivery, queue depth, and Salesforce CDC availability for this tenant."
    });
  }

  if (pipelineVelocity < 7000) {
    dynamicInsights.push({
      id: "pipeline-velocity-watch",
      title: "Pipeline velocity is below target",
      severity: "warning",
      summary: `Current modeled pipeline velocity is ${pipelineVelocity.toFixed(0)} per day.`,
      impact: "Sales leadership may need more qualified pipeline entering the funnel.",
      recommendedAction: "Inspect lead quality by source and prioritize high-converting campaigns."
    });
  }

  return [...sampleInsights, ...dynamicInsights];
}
