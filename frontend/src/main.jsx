import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import LoadingScreen from "./components/LoadingScreen";
import { initDb } from "./db/database";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Show a loading screen immediately so there's no blank white flash
// while the on-device SQLite database opens.
root.render(
  <React.StrictMode>
    <LoadingScreen />
  </React.StrictMode>
);

async function start() {
  const MIN_LOADING_MS = 2500;
  const startedAt = Date.now();

  try {
    await initDb();
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }

  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_LOADING_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS - elapsed));
  }

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

start();

