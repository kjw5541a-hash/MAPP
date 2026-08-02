import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./kakao.css";
import App from "./App";
import { loadDraft } from "./store";

// Paints the default theme first, then swaps in the saved draft once IndexedDB
// answers — the editor is usable either way.
loadDraft();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
