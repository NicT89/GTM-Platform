import { describe, expect, it } from "vitest";
import { AnalyticsService } from "../src/modules/analytics/analytics.service";

describe("AnalyticsService", () => {
  it("returns dashboard overview metrics", () => {
    const service = new AnalyticsService();
    const overview = service.getOverview();

    expect(overview.metrics).toHaveLength(6);
    expect(overview.pipelineVelocityPerDay).toBeGreaterThan(0);
  });
});
