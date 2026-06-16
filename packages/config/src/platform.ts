import type { ConnectorAuthType, ConnectorRuntime } from "@market-intel/domain";

export const connectorAuthLabels: Record<ConnectorAuthType, string> = {
  oauth2: "OAuth 2.0",
  manual: "Manual / admin setup",
  api_key: "API token / service role",
  mcp_streamable_http: "MCP Streamable HTTP"
};

export const connectorRuntimeLabels: Record<ConnectorRuntime, string> = {
  remote_api: "Remote API",
  remote_mcp: "Remote MCP",
  local_mcp_bridge: "Local MCP bridge"
};

export const codexTroubleshootingChecklist = [
  "Confirm the MCP server is configured in ~/.codex/config.toml and enabled.",
  "Verify the server responds to initialize over Streamable HTTP before expecting tools in-thread.",
  "Expose deployment credentials through environment variables, not hard-coded secrets.",
  "Prefer Supabase-backed persistence for connector cursors and auth sessions so Codex troubleshooting is repeatable.",
  "Use GitHub workflows to keep Vercel and Supabase deployment steps observable from source control."
] as const;
