import { Injectable } from "@nestjs/common";
import { sampleRecommendations } from "@market-intel/domain";

@Injectable()
export class ActionsService {
  getRecommendations() {
    return {
      generatedAt: new Date().toISOString(),
      items: sampleRecommendations
    };
  }
}
