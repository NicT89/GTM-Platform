import { describe, expect, it } from "vitest";
import { computeOverview, computePipelineVelocity, findAttributedTouchpoint } from "./analytics";
import { sampleDataset } from "./fixtures";

describe("analytics calculators", () => {
  it("computes KPI overview metrics", () => {
    const overview = computeOverview(sampleDataset);

    expect(overview.metrics).toHaveLength(6);
    expect(overview.dataFreshnessMinutes).toBe(11);
    expect(overview.attributionCoverage).toBeGreaterThan(90);
  });

  it("finds first and last touchpoints per opportunity", () => {
    const opportunity = sampleDataset.opportunities[0];
    const firstTouch = findAttributedTouchpoint(sampleDataset.touchpoints, opportunity, "first_touch");
    const lastTouch = findAttributedTouchpoint(sampleDataset.touchpoints, opportunity, "last_touch");

    expect(firstTouch?.campaignId).toBe("campaign-google-brand");
    expect(lastTouch?.campaignId).toBe("campaign-meta-lookalike");
  });

  it("computes a positive pipeline velocity", () => {
    expect(computePipelineVelocity(sampleDataset)).toBeGreaterThan(0);
  });
});
