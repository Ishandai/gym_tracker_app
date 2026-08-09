import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Backup from "./pages/Backup";

export default function App() {
  return (
    <>
      <nav className="top-nav">
        <Link to="/">Today</Link>
        <Link to="/history">History</Link>
        <Link to="/backup">Backup</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/backup" element={<Backup />} />
      </Routes>
    </>
  );
}
