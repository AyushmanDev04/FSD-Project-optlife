import ProgressBar from './ProgressBar.jsx';
import { getReadinessInfo } from '../services/helpers.js';

export default function ReadinessCard({ score }) {
  if (score === null || score === undefined) {
    return (
      <div className="card">
        <h3>Today's readiness</h3>
        <p className="muted">Complete your daily check-in to see your readiness score.</p>
      </div>
    );
  }

  const info = getReadinessInfo(score);

  return (
    <div className="card">
      <h3>Today's readiness</h3>
      <div className="readiness-score">
        {score}
        <span>/ 100</span>
      </div>
      <ProgressBar value={score} />
      <p><strong>{info.label}.</strong> {info.message}</p>
    </div>
  );
}
