# Real-Time Market Intelligence Micro-App

Greenfield monorepo scaffold for a single-tenant managed market intelligence platform that unifies CRM, campaign, and revenue data into one near-real-time analytics layer.

## Workspace

- `apps/web`: Next.js dashboard for marketing and sales leadership.
- `apps/api`: NestJS API for connectors, analytics, attribution, profiles, and insights.
- `apps/mcp-server`: Streamable HTTP MCP bridge for autonomous agent workflows.
- `packages/domain`: Canonical entities, fixtures, KPI calculators, and insight helpers.
- `packages/config`: Shared configuration metadata for phases, connectors, and UI copy.
- `docs`: Architecture notes, deployment setup, MCP integration notes, and Salesforce admin setup guidance.

## MVP Focus

- Near-real-time ingestion contracts for HubSpot, Salesforce, GA4, and Meta Ads.
- Streamable HTTP MCP integration with Brand Kit OS as the primary brand operations source.
- Vercel, Supabase, and GitHub deployment scaffolding.
- Canonical entity model spanning organizations, optional locations, contacts, leads, campaigns, touchpoints, opportunities, spend, and revenue.
- Baseline first-touch and last-touch attribution.
- KPI reporting for CAC, LTV, CPL, ROAS/MER, channel mix, funnel health, and platform freshness.
- Insight cards and approval-ready action recommendations.

## Local Development

1. Copy `.env.example` to `.env`.
2. Start infrastructure with `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Run the API with `npm run dev:api`.
5. Run the dashboard with `npm run dev:web`.
6. Run the MCP bridge with `npm run dev:mcp`.

## Notes

- Connector state now supports auth-start, callback exchange, sync jobs, and webhook receipt, with Supabase-ready persistence hooks.
- Brand Kit OS was verified as a healthy upstream MCP server and is exposed locally through the bridge app for agent use.
- Enrichment and audience sync remain intentionally non-mutating in the MVP scaffold.
