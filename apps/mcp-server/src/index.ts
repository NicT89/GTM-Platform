import express, { type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { codexTroubleshootingChecklist } from "@market-intel/config";
import {
  type ConnectorConnection,
  type ConnectorDefinition,
  type DeploymentTarget,
  sampleConnectorDefinitions,
  sampleConnectorConnections,
  sampleDeploymentTargets,
  sampleMcpBridgeStatus,
  type BrandContextTaskType
} from "@market-intel/domain";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { BrandKitOsUpstream } from "./brand-kit-os-upstream.js";

const app = createMcpExpressApp({
  host: process.env.MCP_SERVER_HOST ?? "127.0.0.1"
});

const brandKitUpstream = new BrandKitOsUpstream();
const transports: Record<string, StreamableHTTPServerTransport> = {};
const marketIntelApiBaseUrl = process.env.MARKET_INTEL_API_BASE_URL ?? "http://127.0.0.1:4000";

interface LiveConnectorRecord extends ConnectorDefinition {
  connection?: ConnectorConnection | null;
}

interface ConnectorsApiPayload {
  connectors?: LiveConnectorRecord[];
  deployments?: DeploymentTarget[];
}

async function fetchApiJson<T>(path: string): Promise<T | undefined> {
  try {
    const response = await fetch(`${marketIntelApiBaseUrl}${path}`, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return undefined;
    }

    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

async function getLiveConnectorRecords(): Promise<LiveConnectorRecord[]> {
  const payload = await fetchApiJson<ConnectorsApiPayload>("/connectors");

  if (payload?.connectors?.length) {
    return payload.connectors;
  }

  return sampleConnectorDefinitions.map((definition) => ({
    ...definition,
    connection: sampleConnectorConnections.find((item) => item.connectorId === definition.id) ?? null
  }));
}

async function getLiveDeploymentTargets(): Promise<DeploymentTarget[]> {
  const payload = await fetchApiJson<DeploymentTarget[]>("/deployments");

  if (Array.isArray(payload) && payload.length > 0) {
    return payload;
  }

  const connectorsPayload = await fetchApiJson<ConnectorsApiPayload>("/connectors");

  if (connectorsPayload?.deployments?.length) {
    return connectorsPayload.deployments;
  }

  return sampleDeploymentTargets;
}

function createServer() {
  const server = new McpServer({
    name: "market-intel-mcp-bridge",
    version: "0.1.0"
  });

  server.registerTool(
    "list_project_connectors",
    {
      title: "List Project Connectors",
      description: "Return all market intelligence connectors, auth modes, and connection state."
    },
    async () => {
      const connectors = await getLiveConnectorRecords();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(connectors, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_connector_detail",
    {
      title: "Get Connector Detail",
      description: "Return one connector definition and its current connection state.",
      inputSchema: {
        connector_id: z.string().describe("Connector key such as hubspot, salesforce, brand_kit_os, vercel, supabase, or github.")
      }
    },
    async ({ connector_id }) => {
      const connectors = await getLiveConnectorRecords();
      const definition = connectors.find((item) => item.id === connector_id);

      if (!definition) {
        return {
          content: [
            {
              type: "text",
              text: `Connector ${connector_id} was not found.`
            }
          ],
          isError: true
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(definition, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "list_brand_kit_resources",
    {
      title: "List Brand Kit Resources",
      description: "List upstream Brand Kit OS resources discovered through the tested MCP server."
    },
    async () => {
      const resources = await brandKitUpstream.listResources();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(resources, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_brand_kit_summary",
    {
      title: "Get Brand Kit Summary",
      description: "Fetch a compact summary for a Brand Kit OS brand kit via the upstream MCP server.",
      inputSchema: {
        brand_kit_id: z.string().describe("The brand kit UUID from Brand Kit OS.")
      }
    },
    async ({ brand_kit_id }) => {
      const summary = await brandKitUpstream.getSummary(brand_kit_id);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_brand_context_for_task",
    {
      title: "Get Brand Context for Task",
      description: "Fetch task-specific brand context from Brand Kit OS for autonomous agent workflows.",
      inputSchema: {
        brand_kit_id: z.string().describe("The brand kit UUID from Brand Kit OS."),
        task_type: z
          .enum([
            "content_creation",
            "voice_check",
            "campaign_planning",
            "product_messaging",
            "persona_embodiment",
            "competitive_analysis"
          ] satisfies BrandContextTaskType[])
          .describe("The agent task type that needs brand context."),
        persona_name: z.string().optional().describe("Optional persona name for persona-specific context.")
      }
    },
    async ({ brand_kit_id, task_type, persona_name }) => {
      const context = await brandKitUpstream.getContext(brand_kit_id, task_type, persona_name);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(context, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "list_deployment_targets",
    {
      title: "List Deployment Targets",
      description: "Return Vercel, Supabase, and GitHub deployment targets plus required environment keys."
    },
    async () => {
      const deployments = await getLiveDeploymentTargets();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(deployments, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_codex_troubleshooting_guide",
    {
      title: "Get Codex Troubleshooting Guide",
      description: "Return the Codex-specific checklist for diagnosing MCP, deployment, and connector issues."
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(codexTroubleshootingChecklist, null, 2)
        }
      ]
    })
  );

  server.registerResource(
    "connector-overview",
    "market-intel://connectors/overview",
    {
      title: "Connector Overview",
      description: "Snapshot of connector definitions and current connection state.",
      mimeType: "application/json"
    },
    async () => {
      const connectors = await getLiveConnectorRecords();

      return {
        contents: [
          {
            uri: "market-intel://connectors/overview",
            text: JSON.stringify(connectors, null, 2)
          }
        ]
      };
    }
  );

  server.registerResource(
    "deployment-targets",
    "market-intel://deployment/targets",
    {
      title: "Deployment Targets",
      description: "Deployment targets and required environment configuration.",
      mimeType: "application/json"
    },
    async () => {
      const deployments = await getLiveDeploymentTargets();

      return {
        contents: [
          {
            uri: "market-intel://deployment/targets",
            text: JSON.stringify(deployments, null, 2)
          }
        ]
      };
    }
  );

  return server;
}

function requireBearerToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.MCP_SERVER_BEARER_TOKEN;

  if (!expected) {
    next();
    return;
  }

  if (req.header("authorization") !== `Bearer ${expected}`) {
    res.status(401).json({
      error: "Unauthorized"
    });
    return;
  }

  next();
}

app.use(requireBearerToken);
app.use(express.json());

app.get("/", async (_req, res) => {
  res.json({
    name: "market-intel-mcp-bridge",
    status: "ok",
    transport: "streamable-http",
    bridge: sampleMcpBridgeStatus,
    upstream: await brandKitUpstream.getHealth()
  });
});

app.get("/health", async (_req, res) => {
  res.json({
    status: "ok",
    upstream: await brandKitUpstream.getHealth()
  });
});

app.post("/mcp", async (req, res) => {
  const sessionId = req.header("mcp-session-id");

  try {
    let transport: StreamableHTTPServerTransport | undefined =
      sessionId && transports[sessionId] ? transports[sessionId] : undefined;

    if (!transport && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (initializedSessionId) => {
          transports[initializedSessionId] = transport!;
        }
      });
      transport.onclose = () => {
        if (transport?.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      const server = createServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (!transport) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: missing session or initialize payload."
        },
        id: null
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : String(error)
        },
        id: null
      });
    }
  }
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.header("mcp-session-id");

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  await transports[sessionId].handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.header("mcp-session-id");

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  await transports[sessionId].handleRequest(req, res);
});

const host = process.env.MCP_SERVER_HOST ?? "127.0.0.1";
const port = Number(process.env.MCP_SERVER_PORT ?? 4100);

app.listen(port, host, () => {
  console.log(`Market Intel MCP bridge listening on http://${host}:${port}/mcp`);
});
