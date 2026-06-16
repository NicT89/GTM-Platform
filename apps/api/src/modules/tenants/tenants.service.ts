import { Injectable, NotFoundException } from "@nestjs/common";
import type { IntegrationKey, TenantSourcePolicy } from "@market-intel/domain";
import { sampleDataset } from "@market-intel/domain";

@Injectable()
export class TenantsService {
  private readonly policies = new Map<string, TenantSourcePolicy>([
    [sampleDataset.tenant.id, sampleDataset.tenant.policy]
  ]);

  getPolicy(tenantId: string) {
    const policy = this.policies.get(tenantId);

    if (!policy) {
      throw new NotFoundException(`Tenant ${tenantId} was not found.`);
    }

    return policy;
  }

  updatePolicy(
    tenantId: string,
    updates: {
      marketingSourcePriority?: IntegrationKey[];
      revenueSourcePriority?: IntegrationKey[];
      identitySourcePriority?: IntegrationKey[];
    }
  ) {
    const current = this.getPolicy(tenantId);
    const next: TenantSourcePolicy = {
      ...current,
      ...updates
    };

    this.policies.set(tenantId, next);
    return next;
  }
}
