import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import type { BrandContextTaskType, IntegrationKey } from "@market-intel/domain";
import { ConnectorsService } from "./connectors.service";

@Controller("connectors")
export class ConnectorsController {
  constructor(private readonly connectorsService: ConnectorsService) {}

  @Get()
  listConnectors() {
    return this.connectorsService.listConnectors();
  }

  @Get("brand-kit-os/resources")
  listBrandKitResources() {
    return this.connectorsService.listBrandKitResources();
  }

  @Get("brand-kit-os/summary/:brandKitId")
  getBrandKitSummary(@Param("brandKitId") brandKitId: string) {
    return this.connectorsService.getBrandKitSummary(brandKitId);
  }

  @Get("brand-kit-os/context/:brandKitId")
  getBrandKitContext(
    @Param("brandKitId") brandKitId: string,
    @Query("taskType") taskType: BrandContextTaskType,
    @Query("personaName") personaName?: string
  ) {
    return this.connectorsService.getBrandContext(brandKitId, taskType, personaName);
  }

  @Get(":connectorId/sync-jobs")
  listSyncJobs(@Param("connectorId") connectorId: IntegrationKey) {
    return this.connectorsService.listSyncJobs(connectorId);
  }

  @Post(":connectorId/auth/start")
  startAuth(
    @Param("connectorId") connectorId: IntegrationKey,
    @Body() body?: { tenantId?: string; redirectUri?: string }
  ) {
    return this.connectorsService.startAuth(connectorId, body?.tenantId, body?.redirectUri);
  }

  @Post(":connectorId/auth/callback")
  finishAuth(
    @Param("connectorId") connectorId: IntegrationKey,
    @Body() body: { code: string; sessionId: string; tenantId?: string }
  ) {
    return this.connectorsService.finishAuth(connectorId, body.code, body.sessionId, body.tenantId);
  }

  @Get(":connectorId")
  getConnector(@Param("connectorId") connectorId: string) {
    return this.connectorsService.getConnector(connectorId);
  }

  @Post(":connectorId/sync")
  queueSync(
    @Param("connectorId") connectorId: IntegrationKey,
    @Body() body?: { mode?: "initial_backfill" | "incremental" | "webhook"; tenantId?: string }
  ) {
    return this.connectorsService.queueSync(connectorId, body?.mode, body?.tenantId);
  }

  @Post(":connectorId/webhook")
  acceptWebhook(
    @Param("connectorId") connectorId: IntegrationKey,
    @Body() body?: Record<string, unknown>
  ) {
    return this.connectorsService.acceptWebhook(connectorId, body ?? {});
  }
}
