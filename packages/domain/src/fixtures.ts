import type {
  ActionRecommendation,
  EnrichmentCard,
  InsightCard,
  IntegrationRecord,
  MarketIntelligenceDataset,
  OrganizationProfile,
  TenantSourcePolicy
} from "./types.js";

export const defaultPolicy: TenantSourcePolicy = {
  tenantId: "tenant-acme-growth",
  marketingSourcePriority: ["hubspot", "ga4", "meta_ads"],
  revenueSourcePriority: ["salesforce", "hubspot"],
  identitySourcePriority: ["hubspot", "salesforce"]
};

export const sampleDataset: MarketIntelligenceDataset = {
  tenant: {
    id: "tenant-acme-growth",
    name: "Acme Growth Group",
    segment: "multi_location",
    freshnessSlaMinutes: 15,
    policy: defaultPolicy
  },
  integrations: [
    {
      id: "hubspot",
      name: "HubSpot",
      syncMode: "hybrid",
      status: "healthy",
      freshnessMinutes: 6,
      capabilities: ["contacts", "forms", "campaign membership", "lifecycle stages"],
      lastSyncAt: "2026-06-14T18:05:00.000Z"
    },
    {
      id: "salesforce",
      name: "Salesforce",
      syncMode: "hybrid",
      status: "degraded",
      freshnessMinutes: 11,
      capabilities: ["accounts", "opportunities", "closed revenue", "owners"],
      lastSyncAt: "2026-06-14T18:01:00.000Z"
    },
    {
      id: "ga4",
      name: "Google Analytics 4",
      syncMode: "polling",
      status: "healthy",
      freshnessMinutes: 8,
      capabilities: ["sessions", "utm events", "landing pages"],
      lastSyncAt: "2026-06-14T18:03:00.000Z"
    },
    {
      id: "meta_ads",
      name: "Meta Ads",
      syncMode: "polling",
      status: "healthy",
      freshnessMinutes: 10,
      capabilities: ["campaign spend", "ad set performance", "audience sync ready"],
      lastSyncAt: "2026-06-14T18:00:00.000Z"
    }
  ],
  organizations: [
    {
      id: "org-northstar",
      name: "Northstar Pizza",
      industry: "Restaurant",
      website: "https://northstarpizza.example",
      status: "customer",
      segment: "multi_location",
      employeeRange: "51-200",
      currentLtv: 64000,
      locationIds: ["loc-columbus", "loc-cincinnati"]
    },
    {
      id: "org-cedarcloud",
      name: "Cedar Cloud ERP",
      industry: "Software",
      website: "https://cedarcloud.example",
      status: "customer",
      segment: "b2b",
      employeeRange: "201-500",
      currentLtv: 125000,
      locationIds: []
    },
    {
      id: "org-harborhealth",
      name: "Harbor Health Dental",
      industry: "Healthcare",
      website: "https://harborhealth.example",
      status: "prospect",
      segment: "multi_location",
      employeeRange: "51-200",
      currentLtv: 0,
      locationIds: ["loc-austin"]
    }
  ],
  locations: [
    {
      id: "loc-columbus",
      name: "Northstar Pizza - Columbus",
      city: "Columbus",
      region: "OH",
      country: "US",
      googleBusinessProfileUrl: "https://maps.google.com/?cid=111"
    },
    {
      id: "loc-cincinnati",
      name: "Northstar Pizza - Cincinnati",
      city: "Cincinnati",
      region: "OH",
      country: "US",
      googleBusinessProfileUrl: "https://maps.google.com/?cid=222"
    },
    {
      id: "loc-austin",
      name: "Harbor Health Dental - Austin",
      city: "Austin",
      region: "TX",
      country: "US",
      googleBusinessProfileUrl: "https://maps.google.com/?cid=333"
    }
  ],
  contacts: [
    {
      id: "contact-1",
      organizationId: "org-northstar",
      fullName: "Marisol Kent",
      email: "marisol@northstar.example",
      role: "VP of Marketing",
      lifecycleStage: "customer"
    },
    {
      id: "contact-2",
      organizationId: "org-cedarcloud",
      fullName: "Ian Torres",
      email: "ian@cedarcloud.example",
      role: "Revenue Operations Director",
      lifecycleStage: "customer"
    },
    {
      id: "contact-3",
      organizationId: "org-harborhealth",
      fullName: "Diana Wu",
      email: "diana@harborhealth.example",
      role: "Growth Lead",
      lifecycleStage: "sql"
    }
  ],
  leads: [
    {
      id: "lead-1",
      contactId: "contact-1",
      source: "hubspot",
      createdAt: "2026-05-06T13:20:00.000Z",
      status: "qualified",
      campaignId: "campaign-google-brand"
    },
    {
      id: "lead-2",
      contactId: "contact-2",
      source: "hubspot",
      createdAt: "2026-05-19T10:15:00.000Z",
      status: "qualified",
      campaignId: "campaign-meta-lookalike"
    },
    {
      id: "lead-3",
      contactId: "contact-3",
      source: "hubspot",
      createdAt: "2026-06-02T15:45:00.000Z",
      status: "working",
      campaignId: "campaign-google-local"
    }
  ],
  opportunities: [
    {
      id: "opp-1",
      organizationId: "org-northstar",
      amount: 32000,
      stage: "won",
      createdAt: "2026-05-10T14:00:00.000Z",
      closedAt: "2026-05-28T16:00:00.000Z",
      owner: "Ana Patel",
      influencedCampaignIds: ["campaign-google-brand", "campaign-meta-lookalike"]
    },
    {
      id: "opp-2",
      organizationId: "org-cedarcloud",
      amount: 65000,
      stage: "won",
      createdAt: "2026-05-21T09:00:00.000Z",
      closedAt: "2026-06-05T17:00:00.000Z",
      owner: "David Ross",
      influencedCampaignIds: ["campaign-meta-lookalike"]
    },
    {
      id: "opp-3",
      organizationId: "org-harborhealth",
      amount: 24000,
      stage: "proposal",
      createdAt: "2026-06-04T12:00:00.000Z",
      owner: "Ana Patel",
      influencedCampaignIds: ["campaign-google-local"]
    }
  ],
  campaigns: [
    {
      id: "campaign-google-brand",
      name: "Google Brand Defense",
      platform: "ga4",
      channel: "paid_search",
      status: "active",
      spend: 8200,
      impressions: 124000,
      clicks: 6210,
      conversions: 142
    },
    {
      id: "campaign-meta-lookalike",
      name: "Meta Lookalike Expansion",
      platform: "meta_ads",
      channel: "paid_social",
      status: "active",
      spend: 9400,
      impressions: 385000,
      clicks: 8780,
      conversions: 126
    },
    {
      id: "campaign-google-local",
      name: "Google Local Intake",
      platform: "ga4",
      channel: "paid_search",
      status: "active",
      spend: 3100,
      impressions: 78000,
      clicks: 2190,
      conversions: 51
    }
  ],
  touchpoints: [
    {
      id: "touch-1",
      organizationId: "org-northstar",
      contactId: "contact-1",
      campaignId: "campaign-google-brand",
      occurredAt: "2026-05-06T13:00:00.000Z",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "brand-defense",
      channel: "paid_search"
    },
    {
      id: "touch-2",
      organizationId: "org-northstar",
      contactId: "contact-1",
      campaignId: "campaign-meta-lookalike",
      occurredAt: "2026-05-11T11:00:00.000Z",
      utmSource: "meta",
      utmMedium: "paid_social",
      utmCampaign: "lookalike-expansion",
      channel: "paid_social"
    },
    {
      id: "touch-3",
      organizationId: "org-cedarcloud",
      contactId: "contact-2",
      campaignId: "campaign-meta-lookalike",
      occurredAt: "2026-05-19T10:00:00.000Z",
      utmSource: "meta",
      utmMedium: "paid_social",
      utmCampaign: "lookalike-expansion",
      channel: "paid_social"
    },
    {
      id: "touch-4",
      organizationId: "org-harborhealth",
      contactId: "contact-3",
      campaignId: "campaign-google-local",
      occurredAt: "2026-06-02T15:00:00.000Z",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "local-intake",
      channel: "paid_search"
    }
  ],
  spendEvents: [
    {
      id: "spend-1",
      campaignId: "campaign-google-brand",
      amount: 8200,
      occurredAt: "2026-06-14T00:00:00.000Z"
    },
    {
      id: "spend-2",
      campaignId: "campaign-meta-lookalike",
      amount: 9400,
      occurredAt: "2026-06-14T00:00:00.000Z"
    },
    {
      id: "spend-3",
      campaignId: "campaign-google-local",
      amount: 3100,
      occurredAt: "2026-06-14T00:00:00.000Z"
    }
  ],
  revenueEvents: [
    {
      id: "rev-1",
      organizationId: "org-northstar",
      opportunityId: "opp-1",
      amount: 32000,
      occurredAt: "2026-05-28T16:00:00.000Z",
      recurringMonthlyRevenue: 2400
    },
    {
      id: "rev-2",
      organizationId: "org-cedarcloud",
      opportunityId: "opp-2",
      amount: 65000,
      occurredAt: "2026-06-05T17:00:00.000Z",
      recurringMonthlyRevenue: 4400
    }
  ]
};

export const sampleEnrichments: EnrichmentCard[] = [
  {
    id: "enrich-google-footprint",
    key: "google_business_footprint",
    title: "Google Business Digital Footprint",
    status: "connected",
    cadence: "daily",
    provenance: "Google Business Profile API",
    summary: "Tracks profile completeness, category alignment, photos, and listing reach."
  },
  {
    id: "enrich-website-structure",
    key: "website_structure",
    title: "Website Ordering Structure",
    status: "ready",
    cadence: "weekly",
    provenance: "First-party crawler",
    summary: "Maps online ordering paths, friction points, and conversion path depth."
  },
  {
    id: "enrich-review-velocity",
    key: "review_velocity",
    title: "Review Velocity",
    status: "connected",
    cadence: "daily",
    provenance: "Google + Yelp + vertical review APIs",
    summary: "Measures reviews per week and sudden rating shifts by location."
  },
  {
    id: "enrich-review-sites",
    key: "known_review_sites",
    title: "Known Review Sites",
    status: "planned",
    cadence: "weekly",
    provenance: "Marketplace card",
    summary: "Discovers relevant review networks by industry and region."
  }
];

export const sampleInsights: InsightCard[] = [
  {
    id: "insight-meta-cac",
    title: "Paid social CAC is rising faster than sourced revenue",
    severity: "warning",
    summary: "Meta spend grew 18% week over week while first-touch revenue held flat.",
    impact: "Watch CAC in paid social and hold incremental spend until audience quality improves.",
    recommendedAction: "Approve a refreshed lookalike audience sync built from won-opportunity contacts."
  },
  {
    id: "insight-search-local",
    title: "Local search is converting efficiently for multi-location prospects",
    severity: "info",
    summary: "Google Local Intake is producing the lowest CPL and strongest lead-to-opportunity conversion.",
    impact: "Shift creative testing toward regional landing pages and local proof points.",
    recommendedAction: "Prioritize location-specific budget recommendations and review velocity enrichment."
  },
  {
    id: "insight-salesforce",
    title: "Salesforce freshness is close to SLA",
    severity: "critical",
    summary: "Salesforce sync lag is 11 minutes with one retry spike in the last hour.",
    impact: "Revenue attribution confidence will drop if lag exceeds the 15-minute target.",
    recommendedAction: "Inspect CDC/webhook health and validate the API user's event delivery permissions."
  }
];

export const sampleRecommendations: ActionRecommendation[] = [
  {
    id: "action-1",
    type: "audience_sync",
    title: "Sync top-decile win-rate audience to Meta",
    summary: "Create a refreshed lookalike source audience from closed-won restaurant operators in the last 90 days.",
    destination: "meta_ads",
    approvalRequired: true
  },
  {
    id: "action-2",
    type: "budget_reallocation",
    title: "Recommend moving 12% of paid social budget into local search",
    summary: "Search has stronger CPL and pipeline sourced efficiency over the trailing 30-day window.",
    destination: "dashboard",
    approvalRequired: true
  }
];

export function buildOrganizationProfile(organizationId: string): OrganizationProfile | undefined {
  const organization = sampleDataset.organizations.find((item) => item.id === organizationId);

  if (!organization) {
    return undefined;
  }

  return {
    organization,
    locations: sampleDataset.locations.filter((location) => organization.locationIds.includes(location.id)),
    contacts: sampleDataset.contacts.filter((contact) => contact.organizationId === organizationId),
    enrichments: sampleEnrichments
  };
}
