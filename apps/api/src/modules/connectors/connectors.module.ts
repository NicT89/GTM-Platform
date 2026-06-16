import { Module } from "@nestjs/common";
import { SupabaseService } from "../../common/supabase.service";
import { DeploymentsModule } from "../deployments/deployments.module";
import { BrandKitOsClient } from "./brand-kit-os.client";
import { ConnectorsController } from "./connectors.controller";
import { ConnectorsService } from "./connectors.service";
import { ConnectorsStore } from "./connectors.store";

@Module({
  imports: [DeploymentsModule],
  controllers: [ConnectorsController],
  providers: [ConnectorsService, ConnectorsStore, BrandKitOsClient, SupabaseService],
  exports: [ConnectorsService]
})
export class ConnectorsModule {}
