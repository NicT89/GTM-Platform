interface InsightCardProps {
  title: string;
  severity: "info" | "warning" | "critical";
  summary: string;
  impact: string;
  recommendedAction: string;
}

export function InsightCard({ title, severity, summary, impact, recommendedAction }: InsightCardProps) {
  return (
    <article className={`insight-card insight-card--${severity}`}>
      <div className="insight-card__head">
        <span className="eyebrow">Signal</span>
        <strong>{severity}</strong>
      </div>
      <h3>{title}</h3>
      <p>{summary}</p>
      <p className="muted">{impact}</p>
      <p className="action-note">{recommendedAction}</p>
    </article>
  );
}
