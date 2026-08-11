function toISO(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * dates: array of "YYYY-MM-DD" strings (any order, duplicates fine).
 * Returns the current consecutive-day streak, counting backward from today.
 * If today has no log yet, the streak still counts as "alive" as long as
 * yesterday was logged — so logging today just extends it, it doesn't reset
 * to zero the moment the clock passes midnight.
 */
export function calculateStreak(dates) {
  const set = new Set(dates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = new Date(today);
  if (!set.has(toISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (set.has(toISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
