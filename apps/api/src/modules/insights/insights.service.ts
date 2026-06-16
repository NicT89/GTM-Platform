import { Injectable } from "@nestjs/common";
import { generateInsights, sampleDataset } from "@market-intel/domain";

@Injectable()
export class InsightsService {
  listInsights() {
    return {
      generatedAt: new Date().toISOString(),
      items: generateInsights(sampleDataset)
    };
  }
}
