import { useState } from "react";
import { getLogsByRange } from "../db/database";
import WorkoutList from "../components/WorkoutList";

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

export default function History() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);

  const [start, setStart] = useState(toISODate(weekAgo));
  const [end, setEnd] = useState(toISODate(today));
  const [days, setDays] = useState([]);
  const [busy, setBusy] = useState(false);

  async function loadRange() {
    setBusy(true);
    try {
      const result = await getLogsByRange(start, end);
      setDays(result);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="history-page">
      <h1>History</h1>
      <div className="range-picker">
        <label>From <input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label>To <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        <button onClick={loadRange} disabled={busy}>{busy ? "Loading..." : "Load"}</button>
      </div>

      {days.length === 0 && <p className="empty-state">Pick a date range and load your history.</p>}

      {days.map((day) => (
        <div key={day.date} className="history-day">
          <h2>{day.day_of_week} — {day.date}</h2>
          <WorkoutList logs={day.exercises} onChanged={loadRange} />
        </div>
      ))}
    </div>
  );
}
