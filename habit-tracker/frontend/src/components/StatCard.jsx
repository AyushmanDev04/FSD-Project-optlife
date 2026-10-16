
export default function StatCard({ label, value, children }) {
  return (
    <div className="card stat-card">
      <p className="muted">{label}</p>
      <h2>{value}</h2>
      {children}
    </div>
  );
}
