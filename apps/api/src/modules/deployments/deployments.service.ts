import { Injectable } from "@nestjs/common";
import { sampleDeploymentTargets } from "@market-intel/domain";
import type { ConnectorConnectionStatus, DeploymentTarget } from "@market-intel/domain";

interface DeploymentTargetStatus extends DeploymentTarget {
  checkedAt: string;
  configured: boolean;
  details: string[];
}

@Injectable()
export class DeploymentsService {
  async listTargets(): Promise<DeploymentTargetStatus[]> {
    return Promise.all(sampleDeploymentTargets.map((target) => this.inspectTarget(target)));
  }

  async getHealth() {
    const targets = await this.listTargets();
    const healthyTargets = targets.filter((target) => target.status === "connected").length;

    return {
      status:
        healthyTargets === targets.length
          ? "healthy"
          : healthyTargets > 0 || targets.some((target) => target.configured)
            ? "degraded"
            : "needs_setup",
      targets
    };
  }

  private async inspectTarget(target: DeploymentTarget): Promise<DeploymentTargetStatus> {
    switch (target.id) {
      case "vercel":
        return this.inspectVercel(target);
      case "supabase":
        return this.inspectSupabase(target);
      case "github":
        return this.inspectGithub(target);
      default:
        return this.buildNeedsSetupTarget(target);
    }
  }

  private buildNeedsSetupTarget(target: DeploymentTarget): DeploymentTargetStatus {
    const missing = target.requiredEnv.filter((key) => !process.env[key]);

    return {
      ...target,
      status: missing.length === 0 ? target.status : "needs_setup",
      configured: missing.length === 0,
      checkedAt: new Date().toISOString(),
      details:
        missing.length === 0 ? ["Credentials are present, but no live health check is configured yet."] : [`Missing env: ${missing.join(", ")}`]
    };
  }

  private async inspectVercel(target: DeploymentTarget): Promise<DeploymentTargetStatus> {
    const token = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!token || !projectId) {
      return this.buildNeedsSetupTarget(target);
    }

    const checkedAt = new Date().toISOString();
    const params = new URLSearchParams();
    const teamId = process.env.VERCEL_TEAM_ID;
    const orgId = process.env.VERCEL_ORG_ID;

    if (teamId) {
      params.set("teamId", teamId);
    }

    if (orgId) {
      params.set("orgId", orgId);
    }

    const query = params.toString();
    const suffix = query ? `?${query}` : "";
    const headers = {
      Authorization: `Bearer ${token}`
    };

    try {
      const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}${suffix}`, {
        headers
      });

      if (!projectResponse.ok) {
        return this.buildErrorTarget(
          target,
          checkedAt,
          `Vercel project lookup failed with ${projectResponse.status}.`
        );
      }

      const projectPayload = (await projectResponse.json()) as { name?: string };
      const deploymentsResponse = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=1${query ? `&${query}` : ""}`,
        { headers }
      );

      if (!deploymentsResponse.ok) {
        return this.buildErrorTarget(
          target,
          checkedAt,
          `Vercel deployment lookup failed with ${deploymentsResponse.status}.`
        );
      }

      const deploymentsPayload = (await deploymentsResponse.json()) as {
        deployments?: Array<{ uid?: string; state?: string; url?: string; createdAt?: number }>;
      };
      const latestDeployment = deploymentsPayload.deployments?.[0];

      return {
        ...target,
        status: "connected",
        configured: true,
        checkedAt,
        summary: `Connected to Vercel project ${projectPayload.name ?? projectId}.`,
        details: latestDeployment
          ? [
              `Latest deployment state: ${latestDeployment.state ?? "unknown"}`,
              `Deployment URL: ${latestDeployment.url ?? "unavailable"}`
            ]
          : ["Project resolved, but no deployments were returned yet."]
      };
    } catch (error) {
      return this.buildErrorTarget(target, checkedAt, this.describeError(error));
    }
  }

  private async inspectSupabase(target: DeploymentTarget): Promise<DeploymentTargetStatus> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return this.buildNeedsSetupTarget(target);
    }

    const checkedAt = new Date().toISOString();

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: "application/openapi+json"
        }
      });

      if (!response.ok) {
        return this.buildErrorTarget(target, checkedAt, `Supabase REST probe failed with ${response.status}.`);
      }

      const projectRef = this.extractSupabaseProjectRef(supabaseUrl);

      return {
        ...target,
        status: "connected",
        configured: true,
        checkedAt,
        summary: `Connected to Supabase project ${projectRef}.`,
        details: ["REST endpoint responded successfully with the provided service role key."]
      };
    } catch (error) {
      return this.buildErrorTarget(target, checkedAt, this.describeError(error));
    }
  }

  private async inspectGithub(target: DeploymentTarget): Promise<DeploymentTargetStatus> {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return this.buildNeedsSetupTarget(target);
    }

    const checkedAt = new Date().toISOString();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "market-intelligence-api"
    };

    try {
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers
      });

      if (!repoResponse.ok) {
        return this.buildErrorTarget(target, checkedAt, `GitHub repo lookup failed with ${repoResponse.status}.`);
      }

      const repoPayload = (await repoResponse.json()) as { full_name?: string; default_branch?: string };
      const runsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
        { headers }
      );

      if (!runsResponse.ok) {
        return this.buildErrorTarget(target, checkedAt, `GitHub Actions lookup failed with ${runsResponse.status}.`);
      }

      const runsPayload = (await runsResponse.json()) as {
        workflow_runs?: Array<{ name?: string; status?: string; conclusion?: string }>;
      };
      const latestRun = runsPayload.workflow_runs?.[0];

      return {
        ...target,
        status: "connected",
        configured: true,
        checkedAt,
        summary: `Connected to GitHub repo ${repoPayload.full_name ?? `${owner}/${repo}`}.`,
        details: latestRun
          ? [
              `Default branch: ${repoPayload.default_branch ?? "unknown"}`,
              `Latest workflow run: ${latestRun.name ?? "unnamed"} (${latestRun.status ?? "unknown"} / ${latestRun.conclusion ?? "pending"})`
            ]
          : [`Default branch: ${repoPayload.default_branch ?? "unknown"}`]
      };
    } catch (error) {
      return this.buildErrorTarget(target, checkedAt, this.describeError(error));
    }
  }

  private buildErrorTarget(
    target: DeploymentTarget,
    checkedAt: string,
    detail: string
  ): DeploymentTargetStatus {
    return {
      ...target,
      status: "error" satisfies ConnectorConnectionStatus,
      configured: true,
      checkedAt,
      summary: `${target.name} credentials are present, but the live health probe failed.`,
      details: [detail]
    };
  }

  private extractSupabaseProjectRef(supabaseUrl: string): string {
    try {
      const hostname = new URL(supabaseUrl).hostname;
      return hostname.split(".")[0] ?? "unknown";
    } catch {
      return "unknown";
    }
  }

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
