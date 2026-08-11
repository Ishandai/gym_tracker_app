import { useState, useEffect, useRef } from "react";

function formatTime(totalSeconds) {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * A per-set rest timer. Press play to start counting up while resting;
 * press pause to stop — the elapsed seconds are saved into this set's
 * rest_seconds value automatically the moment you pause.
 */
export default function RestTimer({ value, onChange }) {
  const [seconds, setSeconds] = useState(Number(value) || 0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  // Stay in sync if the parent resets this set's value (e.g. form cleared after save).
  useEffect(() => {
    if (!running) setSeconds(Number(value) || 0);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  function toggle() {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
      onChange(seconds); // auto-save elapsed rest time the moment it's paused
    } else {
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
  }

  return (
    <div className="rest-timer">
      <button
        type="button"
        className={"timer-btn" + (running ? " running" : "")}
        onClick={toggle}
        aria-label={running ? "Pause rest timer" : "Start rest timer"}
      >
        {running ? "⏸" : "▶"}
      </button>
      <span className="timer-display">{formatTime(seconds)}</span>
    </div>
  );
}
