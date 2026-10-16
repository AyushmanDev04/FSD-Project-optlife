
export default function TodayRoutines({ routines, completionByRoutine, lowReadiness, onComplete, onUndo }) {
  if (routines.length === 0) {
    return (
      <div className="card">
        <h3>Today's routines</h3>
        <p className="muted">No routines are scheduled for today. Add some on the Routines page.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Today's routines</h3>
      {lowReadiness && (
        <p className="suggestion-text">Suggested today: complete the small version of each routine to keep your consistency.</p>
      )}

      <ul className="today-list" style={{ marginTop: 12 }}>
        {routines.map((routine) => {
          const completion = completionByRoutine[routine._id];

          return (
            <li className="today-item" key={routine._id}>
              <div className="today-info">
                <strong>{routine.name}</strong>
                <span className="muted">IF {routine.trigger}</span>
                <span className="muted">Full: {routine.fullVersion} · Small: {routine.smallVersion}</span>
              </div>

              {completion ? (
                <div className="today-actions">
                  <span className="done-tag">Done ({completion.completionType})</span>
                  <button className="btn btn-small btn-secondary" onClick={() => onUndo(completion._id)}>
                    Undo
                  </button>
                </div>
              ) : (
                <div className="today-actions">
                  <button
                    className={`btn btn-small ${lowReadiness ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => onComplete(routine._id, 'full')}
                  >
                    Full
                  </button>
                  <button
                    className={`btn btn-small ${lowReadiness ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => onComplete(routine._id, 'small')}
                  >
                    {lowReadiness ? 'Small (suggested)' : 'Small'}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
