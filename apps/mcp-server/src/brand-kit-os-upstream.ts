import type { BrandContextTaskType, BrandKitResourceSummary, BrandKitSummaryResponse } from "@market-intel/domain";
import { sampleBrandContext, sampleBrandKitResources, sampleBrandKitSummary } from "@market-intel/domain";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

interface BrandKitConfig {
  url: string;
  token: string;
}

interface McpEnvelope<T> {
  jsonrpc: "2.0";
  result: T;
  id: number;
}

export class BrandKitOsUpstream {
  private configPromise?: Promise<BrandKitConfig | undefined>;

  async listResources(): Promise<BrandKitResourceSummary[]> {
    const config = await this.getConfig();

    if (!config) {
      return sampleBrandKitResources;
    }

    const sessionId = await this.initialize(config);
    const payload = await this.sendRequest<{ resources: Array<{ uri: string; name: string; description: string; mimeType: string }> }>(
      config,
      sessionId,
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
  }

  async getSummary(brandKitId: string): Promise<BrandKitSummaryResponse> {
    const config = await this.getConfig();

    if (!config) {
      return { ...sampleBrandKitSummary, brandKitId };
    }

    const sessionId = await this.initialize(config);
    const payload = await this.sendRequest<{
      content?: Array<{ type: string; text?: string }>;
      structuredContent?: { summary?: string; name?: string };
    }>(config, sessionId, 3, "tools/call", {
      name: "get_brand_kit_summary",
      arguments: {
        brand_kit_id: brandKitId
      }
    });

    return {
      brandKitId,
      name: payload.structuredContent?.name ?? sampleBrandKitSummary.name,
      summary:
        payload.structuredContent?.summary ??
        payload.content?.find((item) => item.type === "text")?.text ??
        sampleBrandKitSummary.summary,
      source: "brand_kit_os"
    };
  }

  async getContext(brandKitId: string, taskType: BrandContextTaskType, personaName?: string) {
    const config = await this.getConfig();

    if (!config) {
      return { ...sampleBrandContext, brandKitId, taskType, personaName };
    }

    const sessionId = await this.initialize(config);
    const payload = await this.sendRequest<{
      content?: Array<{ type: string; text?: string }>;
      structuredContent?: { context?: string; system_prompt?: string };
    }>(config, sessionId, 4, "tools/call", {
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
  }

  async getHealth() {
    const config = await this.getConfig();

    if (!config) {
      return {
        connected: false,
        url: "unconfigured",
        server: "brand_kit_os",
        message: "No upstream credentials found."
      };
    }

    const response = await fetch(config.url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json, text/event-stream"
      }
    });
    const payload = (await response.json()) as { status?: string; version?: string };

    return {
      connected: response.ok,
      url: config.url,
      server: "brand_kit_os",
      message: payload.status ?? "unknown",
      version: payload.version ?? "unknown"
    };
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
      const contents = await readFile(join(homedir(), ".codex", "config.toml"), "utf8");
      const urlMatch = contents.match(/\[mcp_servers\.brand_kit_os\][\s\S]*?url = "([^"]+)"/);
      const tokenMatch = contents.match(
        /\[mcp_servers\.brand_kit_os\.http_headers\][\s\S]*?Authorization = "Bearer ([^"]+)"/
      );

      if (!urlMatch || !tokenMatch) {
        return undefined;
      }

      return {
        url: urlMatch[1],
        token: tokenMatch[1]
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
            name: "market-intel-mcp-bridge",
            version: "0.1.0"
          }
        }
      })
    });

    const sessionId = response.headers.get("mcp-session-id");

    if (!response.ok || !sessionId) {
      throw new Error("Unable to initialize upstream Brand Kit OS MCP session.");
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
      throw new Error(`Upstream Brand Kit OS call failed with status ${response.status}.`);
    }

    const body = await response.text();
    const frame = body
      .split("\n")
      .find((line) => line.startsWith("data: "))
      ?.replace(/^data:\s*/, "");

    if (!frame) {
      throw new Error("Expected an MCP data frame from Brand Kit OS.");
    }

    const payload = JSON.parse(frame) as McpEnvelope<T>;
    return payload.result;
  }
}
