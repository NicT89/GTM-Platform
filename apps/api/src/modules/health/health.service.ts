import { Injectable } from "@nestjs/common";
import { sampleDataset } from "@market-intel/domain";

@Injectable()
export class HealthService {
  getStatus() {
    return {
      status: "ok",
      generatedAt: new Date().toISOString(),
      tenant: sampleDataset.tenant.name,
      freshnessSlaMinutes: sampleDataset.tenant.freshnessSlaMinutes,
      integrations: sampleDataset.integrations.map((integration) => ({
        id: integration.id,
        status: integration.status,
        freshnessMinutes: integration.freshnessMinutes,
        lastSyncAt: integration.lastSyncAt
      }))
    };
  }
}
