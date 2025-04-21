import { createRoot } from "react-dom/client";
import App from "./App";
import { injectPixels } from "./lib/injectPixels";

// Example: Retrieve pixel/API keys from localStorage or window.__APP_CONFIG__
const facebookPixel = localStorage.getItem('facebookPixel') || (window as any).__APP_CONFIG__?.facebookPixel;
const snapchatPixel = localStorage.getItem('snapchatPixel') || (window as any).__APP_CONFIG__?.snapchatPixel;
const tiktokPixel = localStorage.getItem('tiktokPixel') || (window as any).__APP_CONFIG__?.tiktokPixel;

injectPixels({ facebookPixel, snapchatPixel, tiktokPixel });
import "./index.css";
import "./lib/i18n"; // Import i18n configuration
import "./lib/api"; // Import API mock implementation

createRoot(document.getElementById("root")!).render(<App />);
