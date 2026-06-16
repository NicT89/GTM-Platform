import { Module } from "@nestjs/common";
import { ActionsModule } from "./modules/actions/actions.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AttributionModule } from "./modules/attribution/attribution.module";
import { ConnectorsModule } from "./modules/connectors/connectors.module";
import { DeploymentsModule } from "./modules/deployments/deployments.module";
import { HealthModule } from "./modules/health/health.module";
import { InsightsModule } from "./modules/insights/insights.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { TenantsModule } from "./modules/tenants/tenants.module";

@Module({
  imports: [
    HealthModule,
    ConnectorsModule,
    DeploymentsModule,
    AnalyticsModule,
    AttributionModule,
    InsightsModule,
    TenantsModule,
    ProfilesModule,
    ActionsModule
  ]
})
export class AppModule {}
