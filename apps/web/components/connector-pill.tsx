interface ConnectorPillProps {
  name: string;
  status: string;
  description: string;
  authLabel: string;
  runtimeLabel: string;
  accountLabel?: string;
  freshnessMinutes?: number;
  setupInstructions?: string[];
}

export function ConnectorPill({
  name,
  status,
  description,
  authLabel,
  runtimeLabel,
  accountLabel,
  freshnessMinutes,
  setupInstructions
}: ConnectorPillProps) {
  return (
    <article className="connector-pill">
      <div className="connector-pill__top">
        <h3>{name}</h3>
        <span className={`status-badge status-badge--${status}`}>{status}</span>
      </div>
      <p>{description}</p>
      <ul className="mini-list">
        <li>{authLabel}</li>
        <li>{runtimeLabel}</li>
        <li>{accountLabel ?? "Awaiting connection"}</li>
        <li>{freshnessMinutes !== undefined ? `${freshnessMinutes} min lag` : "No active sync yet"}</li>
        {setupInstructions?.[0] ? <li>{setupInstructions[0]}</li> : null}
      </ul>
    </article>
  );
}
