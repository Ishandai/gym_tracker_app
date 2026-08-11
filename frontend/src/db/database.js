import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";

const DB_NAME = "gymtracker";
const sqlite = new SQLiteConnection(CapacitorSQLite);

let dbInstance = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_name TEXT NOT NULL,
  log_date TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  sets TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_logs_exercise_date ON workout_logs(exercise_name, log_date);

CREATE TABLE IF NOT EXISTS diet_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_date TEXT NOT NULL,
  food_name TEXT NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_diet_date ON diet_logs(log_date);
`;

/**
 * Opens (or reuses) the on-device SQLite connection and ensures the schema exists.
 * Must be awaited once before any other db function is called — call this in main.jsx
 * before rendering the app.
 */
export async function initDb() {
  if (dbInstance) return dbInstance;

  const isConsistent = await sqlite.checkConnectionsConsistency();
  const alreadyOpen = (await sqlite.isConnection(DB_NAME, false)).result;

  const db =
    isConsistent.result && alreadyOpen
      ? await sqlite.retrieveConnection(DB_NAME, false)
      : await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);

  await db.open();
  await db.execute(SCHEMA);

  dbInstance = db;
  return db;
}

function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized — call initDb() before using it.");
  }
  return dbInstance;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dayOfWeekFromDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return DAY_NAMES[d.getDay()];
}

function rowToLog(row) {
  return {
    id: row.id,
    exercise_name: row.exercise_name,
    log_date: row.log_date,
    day_of_week: row.day_of_week,
    sets: JSON.parse(row.sets),
    notes: row.notes,
  };
}

// --- Exercises ---------------------------------------------------------

export async function ensureExercise(name) {
  const db = getDb();
  await db.run("INSERT OR IGNORE INTO exercises (name) VALUES (?)", [name]);
}

export async function listExerciseNames() {
  const db = getDb();
  const res = await db.query(
    "SELECT DISTINCT exercise_name AS name FROM workout_logs ORDER BY exercise_name"
  );
  return (res.values || []).map((r) => r.name);
}

// --- Workout logs --------------------------------------------------------

export async function createLog({ exerciseName, logDate, sets, notes }) {
  const db = getDb();
  const date = logDate || new Date().toISOString().slice(0, 10);
  const dayOfWeek = dayOfWeekFromDate(date);

  await ensureExercise(exerciseName.trim());

  await db.run(
    `INSERT INTO workout_logs (exercise_name, log_date, day_of_week, sets, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [exerciseName.trim(), date, dayOfWeek, JSON.stringify(sets), notes || null]
  );
}

export async function getLogsByDate(date) {
  const db = getDb();
  const res = await db.query(
    "SELECT * FROM workout_logs WHERE log_date = ? ORDER BY id",
    [date]
  );
  return (res.values || []).map(rowToLog);
}

export async function getLogsByRange(start, end) {
  const db = getDb();
  const res = await db.query(
    "SELECT * FROM workout_logs WHERE log_date BETWEEN ? AND ? ORDER BY log_date, id",
    [start, end]
  );
  const logs = (res.values || []).map(rowToLog);

  const byDay = {};
  for (const log of logs) {
    if (!byDay[log.log_date]) {
      byDay[log.log_date] = { date: log.log_date, day_of_week: log.day_of_week, exercises: [] };
    }
    byDay[log.log_date].exercises.push(log);
  }
  return Object.values(byDay);
}

export async function getLogsForExercise(exerciseName) {
  const db = getDb();
  const res = await db.query(
    "SELECT log_date, sets FROM workout_logs WHERE exercise_name = ? ORDER BY log_date",
    [exerciseName]
  );
  return (res.values || []).map((r) => ({ log_date: r.log_date, sets: JSON.parse(r.sets) }));
}

export async function deleteLog(id) {
  const db = getDb();
  await db.run("DELETE FROM workout_logs WHERE id = ?", [id]);
}

/** Most recent previously-logged entry for this exercise, excluding the given date. Used for "repeat last session". */
export async function getMostRecentLogForExercise(exerciseName, excludeDate) {
  const db = getDb();
  const res = await db.query(
    "SELECT * FROM workout_logs WHERE exercise_name = ? AND log_date != ? ORDER BY log_date DESC, id DESC LIMIT 1",
    [exerciseName, excludeDate || ""]
  );
  const rows = res.values || [];
  return rows.length ? rowToLog(rows[0]) : null;
}

/** Every distinct date with at least one workout logged — used for the streak counter. */
export async function getAllWorkoutDates() {
  const db = getDb();
  const res = await db.query("SELECT DISTINCT log_date FROM workout_logs ORDER BY log_date DESC");
  return (res.values || []).map((r) => r.log_date);
}

export async function updateLog(id, { sets, notes }) {
  const db = getDb();
  if (sets !== undefined) {
    await db.run("UPDATE workout_logs SET sets = ? WHERE id = ?", [JSON.stringify(sets), id]);
  }
  if (notes !== undefined) {
    await db.run("UPDATE workout_logs SET notes = ? WHERE id = ?", [notes, id]);
  }
}

// --- Diet logs -----------------------------------------------------------

function rowToDietLog(row) {
  return {
    id: row.id,
    log_date: row.log_date,
    food_name: row.food_name,
    calories: row.calories,
    protein: row.protein,
  };
}

export async function createDietLog({ foodName, logDate, calories, protein }) {
  const db = getDb();
  const date = logDate || new Date().toISOString().slice(0, 10);

  await db.run(
    `INSERT INTO diet_logs (log_date, food_name, calories, protein) VALUES (?, ?, ?, ?)`,
    [date, foodName.trim(), Number(calories), Number(protein)]
  );
}

export async function getDietLogsByDate(date) {
  const db = getDb();
  const res = await db.query(
    "SELECT * FROM diet_logs WHERE log_date = ? ORDER BY id",
    [date]
  );
  return (res.values || []).map(rowToDietLog);
}

export async function deleteDietLog(id) {
  const db = getDb();
  await db.run("DELETE FROM diet_logs WHERE id = ?", [id]);
}

export async function updateDietLog(id, { foodName, calories, protein }) {
  const db = getDb();
  if (foodName !== undefined) {
    await db.run("UPDATE diet_logs SET food_name = ? WHERE id = ?", [foodName.trim(), id]);
  }
  if (calories !== undefined) {
    await db.run("UPDATE diet_logs SET calories = ? WHERE id = ?", [Number(calories), id]);
  }
  if (protein !== undefined) {
    await db.run("UPDATE diet_logs SET protein = ? WHERE id = ?", [Number(protein), id]);
  }
}

// --- Export / backup -------------------------------------------------------

/** Returns every log (workout + diet) as plain JSON-serializable arrays — used by the Backup page. */
export async function exportAllData() {
  const db = getDb();
  const workoutRes = await db.query("SELECT * FROM workout_logs ORDER BY log_date, id");
  const dietRes = await db.query("SELECT * FROM diet_logs ORDER BY log_date, id");
  return {
    workouts: (workoutRes.values || []).map(rowToLog),
    diet: (dietRes.values || []).map(rowToDietLog),
  };
}
