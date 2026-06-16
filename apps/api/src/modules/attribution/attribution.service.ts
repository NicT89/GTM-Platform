import { Injectable } from "@nestjs/common";
import { findAttributedTouchpoint, sampleDataset } from "@market-intel/domain";

@Injectable()
export class AttributionService {
  getSummary() {
    const rows = sampleDataset.opportunities.map((opportunity) => {
      const firstTouch = findAttributedTouchpoint(sampleDataset.touchpoints, opportunity, "first_touch");
      const lastTouch = findAttributedTouchpoint(sampleDataset.touchpoints, opportunity, "last_touch");

      return {
        opportunityId: opportunity.id,
        amount: opportunity.amount,
        stage: opportunity.stage,
        firstTouchCampaignId: firstTouch?.campaignId ?? null,
        lastTouchCampaignId: lastTouch?.campaignId ?? null
      };
    });

    return {
      coverage: `${rows.filter((row) => row.firstTouchCampaignId || row.lastTouchCampaignId).length}/${rows.length}`,
      rows
    };
  }
}
