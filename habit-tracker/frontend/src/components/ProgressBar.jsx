
export default function ProgressBar({ value }) {
  const safeValue = Math.min(100, Math.max(0, value || 0));

  return (
    <div className="progress-track" aria-label={`${safeValue}% complete`}>
      <div className="progress-fill" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
