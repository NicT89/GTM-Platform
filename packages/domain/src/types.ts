export type IntegrationKey =
  | "hubspot"
  | "salesforce"
  | "ga4"
  | "meta_ads"
  | "google_ads"
  | "attio"
  | "apollo"
  | "clay"
  | "brand_kit_os"
  | "vercel"
  | "supabase"
  | "github"
  | "market_intel_mcp";

export type Channel =
  | "paid_search"
  | "paid_social"
  | "organic"
  | "email"
  | "referral"
  | "direct"
  | "partner";

export type AttributionModel = "first_touch" | "last_touch";
export type SyncMode = "webhook" | "polling" | "hybrid";
export type SyncStatus = "healthy" | "degraded" | "offline";
export type CustomerSegment = "b2b" | "multi_location";

export interface TenantSourcePolicy {
  tenantId: string;
  marketingSourcePriority: IntegrationKey[];
  revenueSourcePriority: IntegrationKey[];
  identitySourcePriority: IntegrationKey[];
}

export interface TenantProfile {
  id: string;
  name: string;
  segment: CustomerSegment;
  freshnessSlaMinutes: number;
  policy: TenantSourcePolicy;
}

export interface Location {
  id: string;
  name: string;
  city: string;
  region: string;
  country: string;
  googleBusinessProfileUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  website: string;
  status: "prospect" | "customer";
  segment: CustomerSegment;
  employeeRange: string;
  currentLtv: number;
  locationIds: string[];
}

export interface Contact {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  role: string;
  lifecycleStage: "subscriber" | "lead" | "mql" | "sql" | "customer";
}

export interface Lead {
  id: string;
  contactId: string;
  source: IntegrationKey;
  createdAt: string;
  status: "new" | "working" | "qualified" | "disqualified";
  campaignId?: string;
}

export interface Opportunity {
  id: string;
  organizationId: string;
  amount: number;
  stage: "pipeline" | "proposal" | "negotiation" | "won" | "lost";
  createdAt: string;
  closedAt?: string;
  owner: string;
  influencedCampaignIds: string[];
}

export interface Campaign {
  id: string;
  name: string;
  platform: IntegrationKey;
  channel: Channel;
  status: "active" | "paused" | "archived";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface Touchpoint {
  id: string;
  organizationId: string;
  contactId?: string;
  campaignId: string;
  occurredAt: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  channel: Channel;
}

export interface SpendEvent {
  id: string;
  campaignId: string;
  amount: number;
  occurredAt: string;
}

export interface RevenueEvent {
  id: string;
  organizationId: string;
  opportunityId: string;
  amount: number;
  occurredAt: string;
  recurringMonthlyRevenue: number;
}

export interface IntegrationRecord {
  id: IntegrationKey;
  name: string;
  syncMode: SyncMode;
  status: SyncStatus;
  freshnessMinutes: number;
  capabilities: string[];
  lastSyncAt: string;
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  trend: string;
  status: "good" | "watch" | "risk";
  description: string;
}

export interface ChannelMixItem {
  channel: Channel;
  spend: number;
  spendShare: number;
  revenue: number;
}

export interface FunnelMetric {
  label: string;
  value: number;
  conversionRate?: number;
}

export interface AnalyticsOverview {
  generatedAt: string;
  metrics: MetricCard[];
  channelMix: ChannelMixItem[];
  funnel: FunnelMetric[];
  dataFreshnessMinutes: number;
  syncFailuresLast24h: number;
  attributionCoverage: number;
}

export interface InsightCard {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  summary: string;
  impact: string;
  recommendedAction: string;
}

export interface EnrichmentCard {
  id: string;
  key: string;
  title: string;
  status: "ready" | "connected" | "stale" | "planned";
  cadence: string;
  provenance: string;
  summary: string;
}

export interface OrganizationProfile {
  organization: Organization;
  locations: Location[];
  contacts: Contact[];
  enrichments: EnrichmentCard[];
}

export interface ActionRecommendation {
  id: string;
  type: "audience_sync" | "budget_reallocation" | "alert";
  title: string;
  summary: string;
  destination: "meta_ads" | "google_ads" | "dashboard";
  approvalRequired: boolean;
}

export interface MarketIntelligenceDataset {
  tenant: TenantProfile;
  integrations: IntegrationRecord[];
  organizations: Organization[];
  locations: Location[];
  contacts: Contact[];
  leads: Lead[];
  opportunities: Opportunity[];
  campaigns: Campaign[];
  touchpoints: Touchpoint[];
  spendEvents: SpendEvent[];
  revenueEvents: RevenueEvent[];
}
