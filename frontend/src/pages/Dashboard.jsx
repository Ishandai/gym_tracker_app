import { useEffect, useState, useCallback } from "react";
import { getLogsByDate, listExerciseNames, getLogsForExercise } from "../db/database";
import { analyzeExerciseProgress } from "../services/progressiveOverload";
import DayTabs from "../components/DayTabs";
import WorkoutForm from "../components/WorkoutForm";
import WorkoutList from "../components/WorkoutList";
import OverloadSuggestion from "../components/OverloadSuggestion";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dayData, setDayData] = useState({ logs: [], day_of_week: "" });
  const [progress, setProgress] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadDay = useCallback(async (date) => {
    const logs = await getLogsByDate(date);
    const dow = logs[0]?.day_of_week || "";
    setDayData({ logs, day_of_week: dow });
  }, []);

  const loadProgress = useCallback(async () => {
    const names = await listExerciseNames();
    const results = [];
    for (const name of names) {
      const logs = await getLogsForExercise(name);
      results.push({ exercise_name: name, ...analyzeExerciseProgress(logs) });
    }
    setProgress(results);
  }, []);

  useEffect(() => {
    loadDay(selectedDate);
  }, [selectedDate, loadDay]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Today's workout</h1>
      </header>

      <p className="prompt-line">Fill in today's workout — pick a day below.</p>

      <DayTabs selectedDate={selectedDate} onSelect={setSelectedDate} />

      <WorkoutForm date={selectedDate} onSaved={() => loadDay(selectedDate)} />

      <h2>Logged for {dayData.day_of_week || ""} ({selectedDate})</h2>
      <WorkoutList logs={dayData.logs} onChanged={() => loadDay(selectedDate)} />

      <div className="suggestions-toggle">
        <button
          onClick={() => {
            setShowSuggestions((s) => !s);
            if (!showSuggestions) loadProgress();
          }}
        >
          {showSuggestions ? "Hide" : "Show"} progressive overload suggestions
        </button>
      </div>

      {showSuggestions && (
        <>
          <h2>Suggestions</h2>
          <OverloadSuggestion progress={progress} />
        </>
      )}
    </div>
  );
}
