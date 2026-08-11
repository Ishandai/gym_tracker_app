import { useState, useEffect, useRef } from "react";
import { createLog, updateLog, getMostRecentLogForExercise } from "../db/database";
import { saveDraft, loadDraft, clearDraft } from "../utils/draft";
import RestTimer from "./RestTimer";

const emptySet = () => ({ reps: "", weight: "", rest_seconds: 0 });

/**
 * editingLog: pass an existing log object to switch into edit mode (updates
 * that log's sets/notes instead of creating a new entry). Pass null/undefined
 * for the normal "log a new exercise" mode.
 * exerciseNames: previously-used exercise names, for the autocomplete list.
 */
export default function WorkoutForm({ date, onSaved, editingLog, onCancelEdit, exerciseNames = [] }) {
  const isEditing = Boolean(editingLog);
  const draftKey = `draft_workout_${date}`;
  const skipDraftSave = useRef(false);

  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState([emptySet()]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [repeatStatus, setRepeatStatus] = useState("");

  // Populate from an existing log when entering edit mode, otherwise restore
  // any unsaved draft for this date (so switching tabs doesn't lose input).
  useEffect(() => {
    skipDraftSave.current = true;
    if (isEditing) {
      setExerciseName(editingLog.exercise_name);
      setSets(editingLog.sets.map((s) => ({ ...s })));
      setNotes(editingLog.notes || "");
    } else {
      const draft = loadDraft(draftKey);
      if (draft) {
        setExerciseName(draft.exerciseName || "");
        setSets(draft.sets && draft.sets.length ? draft.sets : [emptySet()]);
        setNotes(draft.notes || "");
      } else {
        setExerciseName("");
        setSets([emptySet()]);
        setNotes("");
      }
    }
    setRepeatStatus("");
    // Allow the save-effect below to run again after this reset.
    const t = setTimeout(() => { skipDraftSave.current = false; }, 0);
    return () => clearTimeout(t);
  }, [isEditing, editingLog, draftKey]);

  // Persist a draft on every change, only while creating a new entry (not editing).
  useEffect(() => {
    if (isEditing || skipDraftSave.current) return;
    saveDraft(draftKey, { exerciseName, sets, notes });
  }, [exerciseName, sets, notes, isEditing, draftKey]);

  function updateSet(index, field, value) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSet() {
    setSets((prev) => [...prev, emptySet()]);
  }

  function duplicateLastSet() {
    setSets((prev) => {
      const last = prev[prev.length - 1];
      return [...prev, { ...last }];
    });
  }

  function removeSet(index) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleRepeatLastSession() {
    if (!exerciseName.trim()) {
      setError("Type an exercise name first, then repeat its last session.");
      return;
    }
    setError("");
    const last = await getMostRecentLogForExercise(exerciseName.trim(), date);
    if (!last) {
      setRepeatStatus("No previous session found for this exercise yet.");
      return;
    }
    setSets(last.sets.map((s) => ({ ...s })));
    setRepeatStatus(`Loaded sets from ${last.log_date}.`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isEditing && !exerciseName.trim()) {
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
      if (isEditing) {
        await updateLog(editingLog.id, { sets: parsedSets, notes: notes || null });
        onCancelEdit?.();
      } else {
        await createLog({
          exerciseName: exerciseName.trim(),
          logDate: date,
          sets: parsedSets,
          notes: notes || undefined,
        });
        clearDraft(draftKey);
        setExerciseName("");
        setSets([emptySet()]);
        setNotes("");
        setRepeatStatus("");
      }
      onSaved?.();
    } catch (err) {
      setError("Failed to save workout. " + (err?.message || ""));
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    onCancelEdit?.();
  }

  return (
    <form className="workout-form" onSubmit={handleSubmit}>
      <h3>{isEditing ? `Editing: ${editingLog.exercise_name}` : `Log an exercise for ${date}`}</h3>
      {error && <p className="error">{error}</p>}

      {!isEditing && (
        <>
          <input
            list="exercise-name-options"
            placeholder="Exercise name (e.g. Bench Press)"
            value={exerciseName}
            onChange={(e) => { setExerciseName(e.target.value); setRepeatStatus(""); }}
          />
          <datalist id="exercise-name-options">
            {exerciseNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <button type="button" className="secondary repeat-btn" onClick={handleRepeatLastSession}>
            Repeat last session
          </button>
          {repeatStatus && <p className="muted">{repeatStatus}</p>}
        </>
      )}

      <div className="sets-header">
        <span>Set</span><span>Reps</span><span>Weight</span><span>Rest</span><span></span>
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
          <RestTimer
            value={set.rest_seconds}
            onChange={(seconds) => updateSet(i, "rest_seconds", seconds)}
          />
          {sets.length > 1 && (
            <button type="button" className="icon-btn" onClick={() => removeSet(i)}>x</button>
          )}
        </div>
      ))}
      <div className="set-buttons-row">
        <button type="button" className="secondary" onClick={addSet}>+ Add set</button>
        <button type="button" className="secondary" onClick={duplicateLastSet}>Same as last set</button>
      </div>

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? "Saving..." : isEditing ? "Save changes" : "Save exercise"}
        </button>
        {isEditing && (
          <button type="button" className="secondary" onClick={handleCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
