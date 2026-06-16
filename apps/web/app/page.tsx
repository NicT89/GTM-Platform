import { ConnectorPill } from "@/components/connector-pill";
import { InsightCard } from "@/components/insight-card";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { getDashboardData } from "@/lib/api";

export default async function Page() {
  const data = await getDashboardData();
  const connectorRows = data.connectors.connectors ?? [];
  const deploymentRows = data.connectors.deployments ?? data.connectorFallbacks.deployments;
  const brandKitResources = data.brandKit.resources.items ?? data.brandKit.resources;
  const latestSyncJobs = [
    ...(Array.isArray(data.syncJobs.hubspot) ? data.syncJobs.hubspot : []),
    ...(Array.isArray(data.syncJobs.salesforce) ? data.syncJobs.salesforce : []),
    ...(Array.isArray(data.syncJobs.brandKit) ? data.syncJobs.brandKit : [])
  ].slice(0, 5);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow">Real-Time Market Intelligence</span>
          <h1>One operating view for campaign spend, pipeline movement, brand context, and revenue truth.</h1>
          <p>
            Connect HubSpot, Salesforce, GA4, Meta, and Brand Kit OS into a near-real-time command
            center for market teams and sales leadership. The platform now models auth, sync, MCP, and
            deployment operations explicitly.
          </p>
          <div className="hero__badges">
            <span>{data.health.status.toUpperCase()} platform health</span>
            <span>{data.overview.dataFreshnessMinutes} min freshness lag</span>
            <span>{data.attribution.coverage} attribution coverage</span>
          </div>
        </div>

        <div className="hero__panel card">
          <p className="eyebrow">Source-of-Truth Policy</p>
          <h2>{data.health.tenant}</h2>
          <p>Marketing, revenue, and identity precedence stay configurable per tenant.</p>
          <div className="policy-grid">
            <div>
              <span>Marketing</span>
              <strong>{data.policy.marketingSourcePriority.join(" -> ")}</strong>
            </div>
            <div>
              <span>Revenue</span>
              <strong>{data.policy.revenueSourcePriority.join(" -> ")}</strong>
            </div>
            <div>
              <span>Identity</span>
              <strong>{data.policy.identitySourcePriority.join(" -> ")}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="content-block">
        <SectionHeading
          eyebrow="Executive Scoreboard"
          title="Decision-ready metrics for the CMO and sales leadership"
          description="The MVP emphasizes CAC, LTV, CPL, channel mix, revenue efficiency, pipeline sourced, and payback visibility."
        />
        <div className="stats-grid">
          {data.overview.metrics.map((metric) => (
            <StatCard key={metric.id} {...metric} />
          ))}
        </div>
      </section>

      <section className="content-grid">
        <div className="card">
          <SectionHeading
            eyebrow="Connectors"
            title="Live integration control plane"
            description="Every source now exposes auth mode, runtime, and sync readiness instead of existing only as a fixture."
          />
          <div className="connector-grid">
            {connectorRows.map((connector) => (
              <ConnectorPill
                key={connector.id}
                name={connector.name}
                status={connector.connection?.status ?? "disconnected"}
                description={connector.description}
                authLabel={connector.authLabel}
                runtimeLabel={connector.runtimeLabel}
                accountLabel={connector.connection?.accountLabel}
                freshnessMinutes={connector.connection?.freshnessMinutes}
                setupInstructions={connector.connection?.setupInstructions}
              />
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeading
            eyebrow="FP&A View"
            title="Spend, revenue, and efficiency"
            description="The finance lens keeps budget reallocation tied to pipeline and revenue outcomes."
          />
          <dl className="finance-grid">
            <div>
              <dt>Total Spend</dt>
              <dd>${data.finance.totalSpend.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Total Revenue</dt>
              <dd>${data.finance.totalRevenue.toLocaleString()}</dd>
            </div>
            <div>
              <dt>MER</dt>
              <dd>{data.finance.marginEfficiencyRatio}x</dd>
            </div>
            <div>
              <dt>Sourced Pipeline</dt>
              <dd>${data.finance.sourcedPipeline.toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="content-grid">
        <div className="card">
          <SectionHeading
            eyebrow="Brand Kit MCP"
            title="Brand context comes from the tested Brand Kit OS server"
            description="Brand Kit OS is treated as the primary MCP integration for any content or workflow that needs brand intelligence."
          />
          <div className="profile-summary">
            <div>
              <span>Upstream status</span>
              <strong>{data.brandKit.resources.status?.status ?? "healthy"}</strong>
            </div>
            <div>
              <span>Discovered resources</span>
              <strong>{brandKitResources.length}</strong>
            </div>
            <div>
              <span>Transport</span>
              <strong>Streamable HTTP</strong>
            </div>
          </div>
          <div className="brand-context-block">
            <h3>{data.brandKit.summary.name}</h3>
            <p>{data.brandKit.summary.summary}</p>
            <p className="action-note">{data.brandKit.context.context}</p>
          </div>
          <div className="mini-card-list">
            {brandKitResources.slice(0, 4).map((resource) => (
              <article key={resource.id} className="phase-card">
                <h3>{resource.name}</h3>
                <p>{resource.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeading
            eyebrow="Deployment Plane"
            title="Vercel, Supabase, and GitHub are explicit integration targets"
            description="The platform now treats deployment connectivity as part of the operating system, not as an afterthought."
          />
          <div className="mini-card-list">
            {deploymentRows.map((target) => (
              <article key={target.id} className="phase-card">
                <div className="connector-pill__top">
                  <h3>{target.name}</h3>
                  <span className={`status-badge status-badge--${target.status}`}>{target.status}</span>
                </div>
                <p>{target.summary}</p>
                <small>{target.requiredEnv.join(" • ")}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="card">
          <SectionHeading
            eyebrow="Channel Mix"
            title="Where spend is concentrated"
            description="Blended performance by channel helps spot over-investment and white space quickly."
          />
          <div className="mix-list">
            {data.overview.channelMix.map((item) => (
              <div key={`${item.channel}-${item.spend}`} className="mix-row">
                <div>
                  <strong>{item.channel.replaceAll("_", " ")}</strong>
                  <span>{item.spendShare.toFixed(1)}% of spend</span>
                </div>
                <div>
                  <strong>${item.spend.toLocaleString()}</strong>
                  <span>${item.revenue.toLocaleString()} influenced revenue</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeading
            eyebrow="Sync Ops"
            title="Recent connector jobs"
            description="Real auth and sync flows are now represented as explicit jobs instead of one-off fixture values."
          />
          <div className="action-list">
            {latestSyncJobs.map((job) => (
              <article key={job.id} className="action-item">
                <div>
                  <strong>
                    {job.connectorId} • {job.mode}
                  </strong>
                  <p>{job.message ?? `${job.recordsProcessed ?? 0} records processed.`}</p>
                </div>
                <span>{job.status}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="card">
          <SectionHeading
            eyebrow="Funnel"
            title="Lead-to-revenue movement"
            description="First-touch and last-touch attribution can be layered over the funnel without changing ingestion."
          />
          <div className="funnel-list">
            {data.overview.funnel.map((step) => (
              <div key={step.label} className="funnel-item">
                <strong>{step.value}</strong>
                <span>{step.label}</span>
                <em>{step.conversionRate ? `${step.conversionRate}%` : "Baseline"}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeading
            eyebrow="Signals"
            title="Insight cards that shorten the gap between data and action"
            description="The MVP stops short of budget mutation, but it now includes live sync state and brand context alongside campaign signals."
          />
          <div className="insight-grid">
            {data.insights.items.map((insight) => (
              <InsightCard key={insight.id} {...insight} />
            ))}
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="card">
          <SectionHeading
            eyebrow="Profiles"
            title="Company and location intelligence"
            description="Profiles support both classic B2B accounts and multi-location footprints."
          />
          {data.profile ? (
            <>
              <div className="profile-summary">
                <div>
                  <span>Organization</span>
                  <strong>{data.profile.organization.name}</strong>
                </div>
                <div>
                  <span>Segment</span>
                  <strong>{data.profile.organization.segment.replaceAll("_", " ")}</strong>
                </div>
                <div>
                  <span>Locations</span>
                  <strong>{data.profile.locations.length}</strong>
                </div>
              </div>

              <div className="enrichment-grid">
                {data.profile.enrichments.map((card) => (
                  <article key={card.id} className="enrichment-card">
                    <div className="enrichment-card__head">
                      <h3>{card.title}</h3>
                      <span className={`status-badge status-badge--${card.status}`}>{card.status}</span>
                    </div>
                    <p>{card.summary}</p>
                    <small>
                      {card.provenance} • {card.cadence}
                    </small>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="card">
          <SectionHeading
            eyebrow="Actions"
            title="Approval-based next steps"
            description="Audience sync, deployment setup, and brand-aware workflows stay explicit and human-approved in the initial implementation."
          />
          <div className="action-list">
            {data.actions.items.map((action) => (
              <article key={action.id} className="action-item">
                <div>
                  <strong>{action.title}</strong>
                  <p>{action.summary}</p>
                </div>
                <span>{action.destination}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="card">
          <SectionHeading
            eyebrow="Service Boundaries"
            title="Modular monolith with clear seams"
            description="The codebase is organized so ingestion, attribution, intelligence, and action workflows can scale independently later."
          />
          <ul className="bullet-grid">
            {data.boundaries.map((boundary) => (
              <li key={boundary}>{boundary}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <SectionHeading
            eyebrow="Roadmap"
            title="Phases already represented in the model"
            description="The repo now includes scaffolding for Brand Kit MCP, deployment integrations, and the local bridge server in addition to the analytics roadmap."
          />
          <div className="phase-list">
            {data.phases.map((phase) => (
              <article key={phase.id} className="phase-card">
                <h3>{phase.title}</h3>
                <p>{phase.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
