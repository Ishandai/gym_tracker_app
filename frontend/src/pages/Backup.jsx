import { useState } from "react";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { exportAllData } from "../db/database";

export default function Backup() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    setStatus("");
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const filename = `gym-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;

      await Filesystem.writeFile({
        path: filename,
        data: json,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      setStatus(`Saved to Documents/${filename}. Copy it off your phone (cloud drive, email, USB) to keep it safe.`);
    } catch (err) {
      setStatus("Export failed: " + (err?.message || "unknown error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard">
      <h1>Backup</h1>
      <p className="prompt-line">
        All your data lives only on this phone. There's no server copy, so back up
        periodically — especially before uninstalling the app or switching phones.
      </p>
      <button onClick={handleExport} disabled={busy}>
        {busy ? "Exporting..." : "Export all data to a file"}
      </button>
      {status && <p className="muted" style={{ marginTop: "0.75rem" }}>{status}</p>}
    </div>
  );
}
