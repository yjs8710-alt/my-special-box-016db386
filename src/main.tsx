import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  console.error("React root element was not found.");
} else {
  root.innerHTML = "";
  createRoot(root).render(<App />);
}
