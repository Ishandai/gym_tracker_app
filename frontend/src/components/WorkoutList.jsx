import { deleteLog } from "../db/database";

export default function WorkoutList({ logs, onChanged }) {
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
        <div className="workout-card" key={log.id}>
          <div className="workout-card-header">
            <strong>{log.exercise_name}</strong>
            <button className="icon-btn" onClick={() => handleDelete(log.id)}>Delete</button>
          </div>
          <table>
            <thead>
              <tr><th>Set</th><th>Reps</th><th>Weight</th><th>Rest (s)</th></tr>
            </thead>
            <tbody>
              {log.sets.map((s, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{s.reps}</td>
                  <td>{s.weight}</td>
                  <td>{s.rest_seconds || 0}</td>
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
