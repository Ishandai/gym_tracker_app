import { useEffect, useState } from "react";
import { listExerciseNames, getLogsForExercise } from "../db/database";
import { analyzeExerciseProgress } from "../services/progressiveOverload";
import ProgressChart from "../components/ProgressChart";

export default function Progress() {
  const [exerciseProgress, setExerciseProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const names = await listExerciseNames();
      const results = [];
      for (const name of names) {
        const logs = await getLogsForExercise(name);
        results.push({ exercise_name: name, ...analyzeExerciseProgress(logs) });
      }
      setExerciseProgress(results);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="dashboard">
      <h1>Progress</h1>
      {loading && <p className="muted">Loading...</p>}
      {!loading && exerciseProgress.length === 0 && (
        <p className="empty-state">Log a few workouts to see progress charts here.</p>
      )}
      {exerciseProgress.map((p) => (
        <div className="suggestion-card" key={p.exercise_name}>
          <h3>{p.exercise_name}</h3>
          <ProgressChart weeks={p.weeks} />
        </div>
      ))}
    </div>
  );
}
