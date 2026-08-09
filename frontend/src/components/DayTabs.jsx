// Renders Sun..Sat tabs for the current week, letting the user jump between
// days to fill in that day's workout — the "counter" behavior requested.

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // back up to Sunday
  return d;
}

export function getCurrentWeekDates() {
  const start = startOfWeek(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export default function DayTabs({ selectedDate, onSelect }) {
  const weekDates = getCurrentWeekDates();
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="day-tabs">
      {weekDates.map((dateStr, i) => (
        <button
          key={dateStr}
          className={
            "day-tab" +
            (dateStr === selectedDate ? " active" : "") +
            (dateStr === todayStr ? " today" : "")
          }
          onClick={() => onSelect(dateStr)}
        >
          <span className="day-name">{DAY_NAMES[i]}</span>
          <span className="day-num">{Number(dateStr.slice(8, 10))}</span>
        </button>
      ))}
    </div>
  );
}
