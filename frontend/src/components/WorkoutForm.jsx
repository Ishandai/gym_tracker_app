import { useState } from "react";
import { createLog } from "../db/database";

const emptySet = () => ({ reps: "", weight: "", rest_seconds: "" });

export default function WorkoutForm({ date, onSaved }) {
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState([emptySet()]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateSet(index, field, value) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSet() {
    setSets((prev) => [...prev, emptySet()]);
  }

  function removeSet(index) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!exerciseName.trim()) {
      setError("Enter an exercise name.");
      return;
    }
    const parsedSets = sets.map((s) => ({
      reps: Number(s.reps),
      weight: Number(s.weight),
      rest_seconds: Number(s.rest_seconds || 0),
    }));
    if (parsedSets.some((s) => !Number.isFinite(s.reps) || !Number.isFinite(s.weight))) {
      setError("Every set needs a valid reps and weight value.");
      return;
    }

    setBusy(true);
    try {
      await createLog({
        exerciseName: exerciseName.trim(),
        logDate: date,
        sets: parsedSets,
        notes: notes || undefined,
      });
      setExerciseName("");
      setSets([emptySet()]);
      setNotes("");
      onSaved?.();
    } catch (err) {
      setError("Failed to save workout. " + (err?.message || ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="workout-form" onSubmit={handleSubmit}>
      <h3>Log an exercise for {date}</h3>
      {error && <p className="error">{error}</p>}

      <input
        placeholder="Exercise name (e.g. Bench Press)"
        value={exerciseName}
        onChange={(e) => setExerciseName(e.target.value)}
      />

      <div className="sets-header">
        <span>Set</span><span>Reps</span><span>Weight</span><span>Rest (s)</span><span></span>
      </div>
      {sets.map((set, i) => (
        <div className="set-row" key={i}>
          <span>{i + 1}</span>
          <input
            type="number"
            min="0"
            value={set.reps}
            onChange={(e) => updateSet(i, "reps", e.target.value)}
            placeholder="Reps"
          />
          <input
            type="number"
            min="0"
            step="0.5"
            value={set.weight}
            onChange={(e) => updateSet(i, "weight", e.target.value)}
            placeholder="Weight"
          />
          <input
            type="number"
            min="0"
            value={set.rest_seconds}
            onChange={(e) => updateSet(i, "rest_seconds", e.target.value)}
            placeholder="Rest"
          />
          {sets.length > 1 && (
            <button type="button" className="icon-btn" onClick={() => removeSet(i)}>x</button>
          )}
        </div>
      ))}
      <button type="button" className="secondary" onClick={addSet}>+ Add set</button>

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button type="submit" disabled={busy}>{busy ? "Saving..." : "Save exercise"}</button>
    </form>
  );
}
