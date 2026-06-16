# Vercel, Supabase, and GitHub Setup

## Target Topology

- `Vercel`: deploy the Next.js frontend from this repository
- `Supabase`: store connector state, credentials, sync cursors, and backend operational data
- `GitHub`: source control and CI entry point for both Vercel and Supabase workflows

## GitHub

1. Create a new GitHub repository for this workspace.
2. Push the repo contents.
3. Store repository-level secrets for:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`
4. Use the included workflow in `.github/workflows/ci.yml` as the baseline validation path.

## Supabase

1. Create a Supabase project.
2. Copy the project URL and service role key into local `.env`.
3. Apply the migration in `supabase/migrations/20260615123000_connector_platform.sql`.
4. Use `tenant_connectors`, `connector_auth_sessions`, `connector_credentials`, `connector_sync_jobs`, and `agent_mcp_registrations` as the minimum platform tables.

## Vercel

1. Import the GitHub repository into Vercel.
2. Confirm the root `vercel.json` settings.
3. Set frontend env vars such as `NEXT_PUBLIC_API_BASE_URL`.
4. Add secure server-side vars for any backend or MCP bridge endpoints if needed.

## Codex Troubleshooting Notes

- If Codex does not expose an MCP server, verify the endpoint manually with `initialize` over Streamable HTTP before assuming the remote server is broken.
- Prefer environment variables for Vercel, Supabase, GitHub, and Brand Kit OS credentials instead of checking secrets into the repo.
- Use the `/deployments` and `/connectors` API endpoints to verify whether the app sees its integration state the same way Codex does.
