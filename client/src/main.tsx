import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n"; // Import i18n configuration
import "./lib/api"; // Import API mock implementation

createRoot(document.getElementById("root")!).render(<App />);
