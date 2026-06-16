# Brand Kit OS MCP Integration

## What Was Verified

- The global Codex config includes `brand_kit_os` as an enabled MCP server.
- The upstream endpoint responds successfully at `https://www.brandkitos.com/mcp`.
- The server responds to `initialize` over Streamable HTTP and returns a valid `mcp-session-id`.
- The server advertises tools, resources, and prompts, so the remote MCP is healthy even if Codex does not surface it directly in a given thread.

## Why This Matters

Brand Kit OS should be the primary brand integration for any content workflow, brand governance check, or asset-aware agent task. Instead of duplicating brand state inside this app, the platform can request brand summaries, task-specific context, personas, assets, and knowledge files directly from the upstream MCP server.

## Recommended Usage Pattern

1. List available brand kits or resources.
2. Select the relevant brand kit for the tenant or workflow.
3. Pull `get_brand_kit_summary` for lightweight orientation.
4. Pull `get_brand_context_for_agent` for task-specific execution.
5. Only then request deeper sections or asset metadata.

## Local Bridge

This repo now includes `apps/mcp-server`, a Streamable HTTP MCP bridge that:

- proxies Brand Kit OS context into a local agent-facing MCP server
- exposes connector and deployment context for autonomous agents
- avoids interactive OAuth for agent-only workflows

Run it with:

```bash
npm run dev:mcp
```

Then connect agents to:

```text
http://127.0.0.1:4100/mcp
```
