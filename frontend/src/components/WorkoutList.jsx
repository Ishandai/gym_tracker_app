import { deleteLog } from "../db/database";

export default function WorkoutList({ logs, onChanged, onEdit, editingId }) {
  async function handleDelete(id) {
    if (!confirm("Delete this logged exercise?")) return;
    await deleteLog(id);
    onChanged?.();
  }

  if (!logs || logs.length === 0) {
    return <p className="empty-state">No exercises logged for this day yet.</p>;
  }

  return (
    <div className="workout-list">
      {logs.map((log) => (
        <div className={"workout-card" + (editingId === log.id ? " editing" : "")} key={log.id}>
          <div className="workout-card-header">
            <strong>{log.exercise_name}</strong>
            <div className="card-actions">
              <button className="secondary" onClick={() => onEdit?.(log)}>Edit</button>
              <button className="icon-btn" onClick={() => handleDelete(log.id)}>Delete</button>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Set</th><th>Reps</th><th>Weight</th><th>Rest</th></tr>
            </thead>
            <tbody>
              {log.sets.map((s, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{s.reps}</td>
                  <td>{s.weight}</td>
                  <td>{Math.floor((s.rest_seconds || 0) / 60)}:{String((s.rest_seconds || 0) % 60).padStart(2, "0")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {log.notes && <p className="notes">{log.notes}</p>}
        </div>
      ))}
    </div>
  );
}
