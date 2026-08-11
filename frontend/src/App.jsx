import { Suspense, lazy } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Backup from "./pages/Backup";

// Progress pulls in recharts (a large charting library) - load it only when
// the user actually opens this tab, instead of bundling it into every launch.
const Progress = lazy(() => import("./pages/Progress"));

export default function App() {
  return (
    <>
      <nav className="top-nav">
        <Link to="/">Today</Link>
        <Link to="/history">History</Link>
        <Link to="/progress">Progress</Link>
        <Link to="/backup">Backup</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route
          path="/progress"
          element={
            <Suspense fallback={<p className="loading" style={{ padding: "1.25rem" }}>Loading charts...</p>}>
              <Progress />
            </Suspense>
          }
        />
        <Route path="/backup" element={<Backup />} />
      </Routes>
    </>
  );
}
