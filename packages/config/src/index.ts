export const platformPhases = [
  {
    id: "phase-1",
    title: "Unified Analytics MVP",
    summary: "Connect HubSpot, Salesforce, GA4, and Meta Ads into one attribution-ready intelligence layer."
  },
  {
    id: "phase-2",
    title: "Enrichment Marketplace",
    summary: "Enable modular profile enrichments with first-party and third-party cards."
  },
  {
    id: "phase-3",
    title: "Audience and Action Workflows",
    summary: "Stage approved audience sync and campaign action recommendations without direct budget mutation."
  }
] as const;

export const connectorBlueprint = [
  "authorize",
  "discover schema/assets",
  "initial backfill",
  "incremental sync",
  "webhook handler",
  "health",
  "field mapping"
] as const;

export const coreServiceBoundaries = [
  "connector orchestration",
  "identity resolution",
  "attribution",
  "analytics / KPI computation",
  "insight generation",
  "profiles and enrichment",
  "audience sync"
] as const;

export * from "./platform.js";
