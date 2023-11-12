import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { invoke } from "@tauri-apps/api/tauri";
import ToastInit from "./notifications";
import 'react-toastify/dist/ReactToastify.css';
import "./styles.scss";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <ToastInit />
  </React.StrictMode>,
);

document.addEventListener('DOMContentLoaded', () => {
  invoke('dom_started');
});