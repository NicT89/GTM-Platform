# Architecture Overview

## Product Shape

The platform is a single-tenant managed market intelligence application for marketing personas with a secondary sales leadership audience. The first release focuses on a unified analytics core that connects campaign, CRM, and revenue systems into one decision-ready operating view.

## Core Runtime

- `apps/web`: Next.js dashboard and intelligence UI.
- `apps/api`: NestJS modular monolith exposing connectors, analytics, attribution, profiles, tenant policy, insights, and action recommendation endpoints.
- `packages/domain`: Canonical entities, shared fixtures, KPI calculators, attribution helpers, and insight generation.
- `packages/config`: Shared phase metadata, connector contracts, and service boundary definitions.

## Data Plane

- `Postgres`: Tenant configuration, source-of-truth policies, canonical entities, action state, and profile metadata.
- `ClickHouse`: Event-heavy touchpoint, spend, and time-series analytics queries.
- `Redis + BullMQ`: Connector orchestration, retries, scheduled syncs, webhook buffering, and future audience/action queues.

## Integration Model

Each connector should conform to the same service contract:

1. `authorize`
2. `discover schema/assets`
3. `initial backfill`
4. `incremental sync`
5. `webhook handler`
6. `health`
7. `field mapping`

This keeps HubSpot, Salesforce, GA4, Meta Ads, and later enrichment providers consistent from an operations standpoint even when their APIs differ.

## MVP Data Flow

1. Campaign and CRM systems emit or expose raw events.
2. Connector orchestration normalizes identities and source timestamps.
3. Canonical entities and touchpoints are persisted.
4. Attribution computes first-touch and last-touch revenue relationships.
5. KPI services compute executive metrics and operational alerts.
6. The dashboard surfaces insights, action recommendations, and profile context.

## Future Modules

- Enrichment marketplace with first-party and imported enrichment cards.
- Audience sync workflows for Meta and Google Ads.
- Optional budget recommendation export or approval flows.
