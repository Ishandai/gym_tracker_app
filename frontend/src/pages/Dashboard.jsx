import { useEffect, useState, useCallback } from "react";
import {
  getLogsByDate, listExerciseNames, getLogsForExercise,
  getDietLogsByDate, getAllWorkoutDates,
} from "../db/database";
import { analyzeExerciseProgress } from "../services/progressiveOverload";
import { calculateStreak } from "../utils/streak";
import DayTabs from "../components/DayTabs";
import WorkoutForm from "../components/WorkoutForm";
import WorkoutList from "../components/WorkoutList";
import OverloadSuggestion from "../components/OverloadSuggestion";
import DietForm from "../components/DietForm";
import DietList from "../components/DietList";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState("workout"); // "workout" | "diet"

  const [dayData, setDayData] = useState({ logs: [], day_of_week: "" });
  const [dietLogs, setDietLogs] = useState([]);
  const [editingLog, setEditingLog] = useState(null);
  const [exerciseNames, setExerciseNames] = useState([]);
  const [streak, setStreak] = useState(0);

  const [progress, setProgress] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadDay = useCallback(async (date) => {
    const logs = await getLogsByDate(date);
    const dow = logs[0]?.day_of_week || "";
    setDayData({ logs, day_of_week: dow });
  }, []);

  const loadDiet = useCallback(async (date) => {
    const logs = await getDietLogsByDate(date);
    setDietLogs(logs);
  }, []);

  const loadExerciseNames = useCallback(async () => {
    setExerciseNames(await listExerciseNames());
  }, []);

  const loadStreak = useCallback(async () => {
    const dates = await getAllWorkoutDates();
    setStreak(calculateStreak(dates));
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
    setEditingLog(null);
    loadDay(selectedDate);
    loadDiet(selectedDate);
  }, [selectedDate, loadDay, loadDiet]);

  useEffect(() => {
    loadExerciseNames();
    loadStreak();
  }, [loadExerciseNames, loadStreak]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Today's log</h1>
        {streak > 0 && (
          <span className="streak-badge" title="Consecutive days logged">
            🔥 {streak}-day streak
          </span>
        )}
      </header>

      <p className="prompt-line">Pick a day below, then log your workout or diet.</p>

      <DayTabs selectedDate={selectedDate} onSelect={setSelectedDate} />

      <div className="sub-tabs">
        <button
          className={activeTab === "workout" ? "active" : "secondary"}
          onClick={() => setActiveTab("workout")}
        >
          Workout
        </button>
        <button
          className={activeTab === "diet" ? "active" : "secondary"}
          onClick={() => setActiveTab("diet")}
        >
          Diet
        </button>
      </div>

      {activeTab === "workout" && (
        <>
          <WorkoutForm
            date={selectedDate}
            editingLog={editingLog}
            exerciseNames={exerciseNames}
            onCancelEdit={() => setEditingLog(null)}
            onSaved={() => {
              setEditingLog(null);
              loadDay(selectedDate);
              loadExerciseNames();
              loadStreak();
            }}
          />

          <h2>Logged for {dayData.day_of_week || ""} ({selectedDate})</h2>
          <WorkoutList
            logs={dayData.logs}
            editingId={editingLog?.id}
            onEdit={(log) => setEditingLog(log)}
            onChanged={() => { loadDay(selectedDate); loadStreak(); }}
          />

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
        </>
      )}

      {activeTab === "diet" && (
        <>
          <DietForm date={selectedDate} onSaved={() => loadDiet(selectedDate)} />
          <h2>Food logged for {selectedDate}</h2>
          <DietList logs={dietLogs} onChanged={() => loadDiet(selectedDate)} />
        </>
      )}
    </div>
  );
}
