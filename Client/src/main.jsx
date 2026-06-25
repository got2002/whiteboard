import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './sketchpad.css'
import './math-function.css'
import App from './App.jsx'

// Polyfill for HTML5 drag and drop on touch devices (IFPD / Tablets)
import { polyfill } from "mobile-drag-drop";
// optional import of scroll behaviour
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
// minimal css for drag image
import "mobile-drag-drop/default.css";

polyfill({
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride
});

// Important: must add this event listener to make it work seamlessly on Safari/iOS and some touch screens
window.addEventListener("touchmove", function() {}, {passive: false});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
