import { deleteDietLog } from "../db/database";

export default function DietList({ logs, onChanged }) {
  async function handleDelete(id) {
    if (!confirm("Delete this food entry?")) return;
    await deleteDietLog(id);
    onChanged?.();
  }

  if (!logs || logs.length === 0) {
    return <p className="empty-state">No food logged for this day yet.</p>;
  }

  const totalCalories = logs.reduce((sum, l) => sum + Number(l.calories), 0);
  const totalProtein = logs.reduce((sum, l) => sum + Number(l.protein), 0);

  return (
    <div className="diet-list">
      <table>
        <thead>
          <tr><th>Food</th><th>Calories</th><th>Protein (g)</th><th></th></tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.food_name}</td>
              <td>{log.calories}</td>
              <td>{log.protein}</td>
              <td><button className="icon-btn" onClick={() => handleDelete(log.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="diet-total-row">
            <td>Total</td>
            <td>{totalCalories}</td>
            <td>{totalProtein.toFixed(1)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
