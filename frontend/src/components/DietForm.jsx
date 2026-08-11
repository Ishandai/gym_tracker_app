import { useState, useEffect, useRef } from "react";
import { createDietLog } from "../db/database";
import { saveDraft, loadDraft, clearDraft } from "../utils/draft";

export default function DietForm({ date, onSaved }) {
  const draftKey = `draft_diet_${date}`;
  const skipDraftSave = useRef(false);

  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    skipDraftSave.current = true;
    const draft = loadDraft(draftKey);
    setFoodName(draft?.foodName || "");
    setCalories(draft?.calories || "");
    setProtein(draft?.protein || "");
    const t = setTimeout(() => { skipDraftSave.current = false; }, 0);
    return () => clearTimeout(t);
  }, [draftKey]);

  useEffect(() => {
    if (skipDraftSave.current) return;
    saveDraft(draftKey, { foodName, calories, protein });
  }, [foodName, calories, protein, draftKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!foodName.trim()) {
      setError("Enter a food name.");
      return;
    }
    const cal = Number(calories);
    const pro = Number(protein);
    if (!Number.isFinite(cal) || cal < 0 || !Number.isFinite(pro) || pro < 0) {
      setError("Enter valid calorie and protein values.");
      return;
    }

    setBusy(true);
    try {
      await createDietLog({ foodName: foodName.trim(), logDate: date, calories: cal, protein: pro });
      clearDraft(draftKey);
      setFoodName("");
      setCalories("");
      setProtein("");
      onSaved?.();
    } catch (err) {
      setError("Failed to save entry. " + (err?.message || ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="workout-form" onSubmit={handleSubmit}>
      <h3>Log food for {date}</h3>
      {error && <p className="error">{error}</p>}

      <input
        placeholder="Food name (e.g. Chicken breast, 200g)"
        value={foodName}
        onChange={(e) => setFoodName(e.target.value)}
      />
      <div className="diet-inputs">
        <input
          type="number"
          min="0"
          step="1"
          placeholder="Calories"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Protein (g)"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />
      </div>

      <button type="submit" disabled={busy}>{busy ? "Saving..." : "Save food entry"}</button>
    </form>
  );
}
