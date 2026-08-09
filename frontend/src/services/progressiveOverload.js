/**
 * Progressive Overload Engine (runs entirely on-device)
 * -------------------------------------------------------
 * 1. e1RM (estimated 1-rep max) via Epley formula normalizes performance
 *    across sessions with different reps/weight combos:
 *        e1RM = weight * (1 + reps / 30)
 * 2. Logs are grouped by ISO week; the best set's e1RM represents that week.
 * 3. Suggestion logic compares the most recent completed week vs the one before:
 *    - e1RM up AND all sets hit the rep ceiling (12) -> suggest weight increase (+2.5%)
 *    - e1RM up but reps still below ceiling -> suggest +1 rep next session
 *    - e1RM down two weeks running -> suggest deload (-10%)
 *    - e1RM roughly flat (within 1%) -> suggest a change to break a plateau
 *    - Falling rest time with steady load/reps is flagged as a conditioning signal.
 */

const REP_CEILING = 12;
const FLAT_THRESHOLD = 0.01;

export function epley1RM(weight, reps) {
  return weight * (1 + reps / 30);
}

export function isoWeekKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + (((4 - target.getUTCDay()) + 7) % 7));
  }
  const weekNumber = 1 + Math.round((firstThursday - target.valueOf()) / (7 * 86400000));
  return `${d.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

/**
 * logs: [{ log_date: "YYYY-MM-DD", sets: [{reps, weight, rest_seconds}] }, ...]
 */
export function analyzeExerciseProgress(logs) {
  if (!logs || logs.length === 0) {
    return { status: "no_data", message: "No logs yet for this exercise." };
  }

  const byWeek = {};
  for (const log of logs) {
    const wk = isoWeekKey(log.log_date);
    if (!byWeek[wk]) byWeek[wk] = [];
    byWeek[wk].push(...log.sets);
  }

  const weekKeys = Object.keys(byWeek).sort();
  if (weekKeys.length === 0) {
    return { status: "no_data", message: "No logs yet for this exercise." };
  }

  const weekSummaries = weekKeys.map((wk) => {
    const sets = byWeek[wk];
    const best = sets.reduce(
      (max, s) => {
        const e = epley1RM(Number(s.weight), Number(s.reps));
        return e > max.e1rm ? { e1rm: e, weight: Number(s.weight), reps: Number(s.reps) } : max;
      },
      { e1rm: -Infinity, weight: 0, reps: 0 }
    );

    const avgReps = sets.reduce((sum, s) => sum + Number(s.reps), 0) / sets.length;
    const avgRest = sets.reduce((sum, s) => sum + Number(s.rest_seconds || 0), 0) / sets.length;
    const allHitCeiling = sets.every((s) => Number(s.reps) >= REP_CEILING);

    return {
      week: wk,
      best_e1rm: Math.round(best.e1rm * 10) / 10,
      best_weight: best.weight,
      best_reps: best.reps,
      avgReps,
      avgRest,
      allHitCeiling,
    };
  });

  if (weekSummaries.length === 1) {
    return {
      status: "baseline",
      message: "First week logged for this exercise — keep logging to unlock suggestions.",
      weeks: weekSummaries,
    };
  }

  const last = weekSummaries[weekSummaries.length - 1];
  const prev = weekSummaries[weekSummaries.length - 2];
  const prev2 = weekSummaries.length >= 3 ? weekSummaries[weekSummaries.length - 3] : null;

  const change = prev.best_e1rm ? (last.best_e1rm - prev.best_e1rm) / prev.best_e1rm : 0;

  let suggestion;
  if (change <= -FLAT_THRESHOLD && prev2 && prev.best_e1rm < prev2.best_e1rm) {
    suggestion = {
      action: "deload",
      message: `Performance dropped two weeks in a row. Consider a deload: reduce weight ~10% (try ${(last.best_weight * 0.9).toFixed(1)}) and rebuild.`,
    };
  } else if (change > FLAT_THRESHOLD && last.allHitCeiling) {
    const suggestedWeight = last.best_weight * 1.025;
    suggestion = {
      action: "increase_weight",
      message: `You're hitting ${REP_CEILING}+ reps with good progress. Increase weight to ~${suggestedWeight.toFixed(1)} (from ${last.best_weight}), and drop back to the lower end of your rep range.`,
    };
  } else if (change > FLAT_THRESHOLD && !last.allHitCeiling) {
    suggestion = {
      action: "increase_reps",
      message: `Progress is trending up. Keep the weight (${last.best_weight}) and aim for +1 rep per set next session before increasing load.`,
    };
  } else if (Math.abs(change) <= FLAT_THRESHOLD) {
    suggestion = {
      action: "break_plateau",
      message: "Performance has been flat for ~2 weeks. Try adding 1 rep, or trimming rest time slightly, to push past the plateau.",
    };
  } else {
    suggestion = {
      action: "monitor",
      message: "Performance dipped slightly. Keep current weight/reps one more week and reassess.",
    };
  }

  let conditioningNote = null;
  if (prev && last.avgRest < prev.avgRest - 5 && Math.abs(change) <= FLAT_THRESHOLD * 3) {
    conditioningNote = `Rest time between sets is dropping (${Math.round(prev.avgRest)}s -> ${Math.round(last.avgRest)}s) while load held steady — good conditioning progress.`;
  }

  return {
    status: "ok",
    weeks: weekSummaries,
    latest_week: last,
    change_pct: Math.round(change * 1000) / 10,
    suggestion,
    conditioning_note: conditioningNote,
  };
}
