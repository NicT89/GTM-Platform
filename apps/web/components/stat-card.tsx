interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  description: string;
  status: "good" | "watch" | "risk";
}

export function StatCard({ label, value, trend, description, status }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${status}`}>
      <div className="stat-card__meta">
        <span>{label}</span>
        <strong>{trend}</strong>
      </div>
      <h3>{value}</h3>
      <p>{description}</p>
    </article>
  );
}
