# Codex Troubleshooting Playbook

## MCP Visibility

If an MCP server is configured in `~/.codex/config.toml` but no tools or resources appear in a thread:

1. Verify the server is enabled in config.
2. Test `GET` and `initialize` directly against the endpoint.
3. Confirm the server returns tools/resources after initialization.
4. If the remote server is healthy, treat the issue as a Codex discovery/attachment problem rather than an upstream outage.

## Deployment Visibility

For Vercel, Supabase, and GitHub:

- keep credentials in `.env` or platform secrets
- expose health and target state through the API
- keep CI checks in GitHub so failures are observable from source control

## Local Services

- Frontend: `npm run dev:web`
- API: `npm run dev:api`
- MCP bridge: `npm run dev:mcp`

## Agent Pattern

For autonomous agents, prefer the local Streamable HTTP bridge in this repo. It centralizes:

- Brand Kit OS brand context
- project connector state
- deployment setup context
- Codex troubleshooting guidance
