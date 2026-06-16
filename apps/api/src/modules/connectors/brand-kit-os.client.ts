import { Injectable } from "@nestjs/common";
import type {
  BrandContextResponse,
  BrandContextTaskType,
  BrandKitResourceSummary,
  BrandKitSummaryResponse
} from "@market-intel/domain";
import {
  sampleBrandContext,
  sampleBrandKitResources,
  sampleBrandKitSummary,
  sampleMcpBridgeStatus
} from "@market-intel/domain";
import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface McpMessageResult<T> {
  result: T;
  id: number;
  jsonrpc: "2.0";
}

interface BrandKitConfig {
  url: string;
  token: string;
}

@Injectable()
export class BrandKitOsClient {
  private configPromise?: Promise<BrandKitConfig | undefined>;

  async getStatus() {
    const config = await this.getConfig();

    if (!config) {
      return {
        ...sampleMcpBridgeStatus,
        status: "degraded" as const,
        notes: [...sampleMcpBridgeStatus.notes, "Brand Kit OS credentials not found in env or Codex config."]
      };
    }

    try {
      const response = await fetch(config.url, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/json, text/event-stream"
        }
      });
      const payload = (await response.json()) as { status?: string; version?: string };
      const resources = await this.listResources();

      return {
        ...sampleMcpBridgeStatus,
        baseUrl: config.url,
        status: response.ok ? "healthy" : "degraded",
        discoveredResources: resources.length,
        notes: [
          `Upstream responded with ${payload.status ?? "unknown"} status.`,
          `Version: ${payload.version ?? "unknown"}.`,
          "Streamable HTTP initialize call verified successfully."
        ]
      };
    } catch (error) {
      return {
        ...sampleMcpBridgeStatus,
        status: "offline" as const,
        baseUrl: config.url,
        notes: [`Failed to reach upstream: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  async listResources(): Promise<BrandKitResourceSummary[]> {
    const config = await this.getConfig();

    if (!config) {
      return sampleBrandKitResources;
    }

    try {
      const session = await this.initialize(config);
      const payload = await this.sendRequest<{ resources: Array<{ uri: string; name: string; description: string; mimeType: string }> }>(
        config,
        session,
        2,
        "resources/list",
        {}
      );

      return payload.resources.map((resource) => ({
        id: resource.uri.replace("brandkit://", ""),
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType
      }));
    } catch {
      return sampleBrandKitResources;
    }
  }

  async getBrandKitSummary(brandKitId: string): Promise<BrandKitSummaryResponse> {
    const config = await this.getConfig();

    if (!config) {
      return { ...sampleBrandKitSummary, brandKitId };
    }

    try {
      const session = await this.initialize(config);
      const payload = await this.sendRequest<{
        content?: Array<{ type: string; text?: string }>;
        structuredContent?: { summary?: string; name?: string };
      }>(config, session, 3, "tools/call", {
        name: "get_brand_kit_summary",
        arguments: {
          brand_kit_id: brandKitId
        }
      });

      const text =
        payload.structuredContent?.summary ??
        payload.content?.find((item) => item.type === "text")?.text ??
        sampleBrandKitSummary.summary;

      return {
        brandKitId,
        name: payload.structuredContent?.name ?? sampleBrandKitSummary.name,
        summary: text,
        source: "brand_kit_os"
      };
    } catch {
      return { ...sampleBrandKitSummary, brandKitId };
    }
  }

  async getBrandContext(
    brandKitId: string,
    taskType: BrandContextTaskType,
    personaName?: string
  ): Promise<BrandContextResponse> {
    const config = await this.getConfig();

    if (!config) {
      return { ...sampleBrandContext, brandKitId, taskType, personaName };
    }

    try {
      const session = await this.initialize(config);
      const payload = await this.sendRequest<{
        content?: Array<{ type: string; text?: string }>;
        structuredContent?: { context?: string; system_prompt?: string };
      }>(config, session, 4, "tools/call", {
        name: "get_brand_context_for_agent",
        arguments: {
          brand_kit_id: brandKitId,
          task_type: taskType,
          persona_name: personaName
        }
      });

      return {
        brandKitId,
        taskType,
        personaName,
        context:
          payload.structuredContent?.context ??
          payload.content?.find((item) => item.type === "text")?.text ??
          sampleBrandContext.context,
        systemPrompt: payload.structuredContent?.system_prompt ?? sampleBrandContext.systemPrompt,
        source: "brand_kit_os"
      };
    } catch {
      return { ...sampleBrandContext, brandKitId, taskType, personaName };
    }
  }

  private async getConfig(): Promise<BrandKitConfig | undefined> {
    this.configPromise ??= this.resolveConfig();
    return this.configPromise;
  }

  private async resolveConfig(): Promise<BrandKitConfig | undefined> {
    if (process.env.BRANDKIT_OS_MCP_URL && process.env.BRANDKIT_OS_BEARER_TOKEN) {
      return {
        url: process.env.BRANDKIT_OS_MCP_URL,
        token: process.env.BRANDKIT_OS_BEARER_TOKEN
      };
    }

    try {
      const configPath = join(homedir(), ".codex", "config.toml");
      const contents = await readFile(configPath, "utf8");
      const urlMatch = contents.match(/\[mcp_servers\.brand_kit_os\][\s\S]*?url = "([^"]+)"/);
      const headerMatch = contents.match(
        /\[mcp_servers\.brand_kit_os\.http_headers\][\s\S]*?Authorization = "Bearer ([^"]+)"/
      );

      if (!urlMatch || !headerMatch) {
        return undefined;
      }

      return {
        url: urlMatch[1],
        token: headerMatch[1]
      };
    } catch {
      return undefined;
    }
  }

  private async initialize(config: BrandKitConfig): Promise<string> {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: {
            name: "market-intelligence-api",
            version: "0.1.0"
          }
        }
      })
    });

    const sessionId = response.headers.get("mcp-session-id");

    if (!response.ok || !sessionId) {
      throw new Error("Brand Kit OS initialize failed.");
    }

    return sessionId;
  }

  private async sendRequest<T>(
    config: BrandKitConfig,
    sessionId: string,
    id: number,
    method: string,
    params: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "Mcp-Session-Id": sessionId
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`Brand Kit OS request failed with status ${response.status}.`);
    }

    const body = await response.text();
    const dataLine = body
      .split("\n")
      .find((line) => line.startsWith("data: "))
      ?.replace(/^data:\s*/, "");

    if (!dataLine) {
      throw new Error("Brand Kit OS did not return an MCP data frame.");
    }

    const parsed = JSON.parse(dataLine) as McpMessageResult<T>;
    return parsed.result;
  }
}
