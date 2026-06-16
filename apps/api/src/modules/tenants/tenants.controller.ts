import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import type { IntegrationKey } from "@market-intel/domain";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get(":tenantId/policy")
  getPolicy(@Param("tenantId") tenantId: string) {
    return this.tenantsService.getPolicy(tenantId);
  }

  @Patch(":tenantId/policy")
  updatePolicy(
    @Param("tenantId") tenantId: string,
    @Body()
    body: {
      marketingSourcePriority?: IntegrationKey[];
      revenueSourcePriority?: IntegrationKey[];
      identitySourcePriority?: IntegrationKey[];
    }
  ) {
    return this.tenantsService.updatePolicy(tenantId, body);
  }
}
