const ACTION_LABELS = {
  increase_weight: "Increase weight",
  increase_reps: "Add a rep",
  deload: "Deload recommended",
  break_plateau: "Plateau detected",
  monitor: "Keep monitoring",
};

export default function OverloadSuggestion({ progress }) {
  if (!progress || progress.length === 0) {
    return <p className="empty-state">Log a few sessions to unlock progressive-overload suggestions.</p>;
  }

  return (
    <div className="suggestion-list">
      {progress.map((p) => (
        <div className="suggestion-card" key={p.exercise_name}>
          <div className="suggestion-header">
            <strong>{p.exercise_name}</strong>
            {p.suggestion && (
              <span className={`badge badge-${p.suggestion.action}`}>
                {ACTION_LABELS[p.suggestion.action] || p.suggestion.action}
              </span>
            )}
          </div>
          {p.status === "no_data" && <p className="muted">{p.message}</p>}
          {p.status === "baseline" && <p className="muted">{p.message}</p>}
          {p.status === "ok" && (
            <>
              <p>{p.suggestion.message}</p>
              {p.conditioning_note && <p className="muted">{p.conditioning_note}</p>}
              <p className="muted">Week-over-week change: {p.change_pct}% (e1RM)</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
