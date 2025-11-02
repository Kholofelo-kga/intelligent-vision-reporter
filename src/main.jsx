import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import WelcomePage from "./WelcomePage.jsx";
import Register from "./Register.jsx";
import App from "./App.jsx";       // the camera + report page
import Admin from "./Admin.jsx";   // municipality dashboard
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Landing choice: Register or Guest */}
        <Route path="/" element={<WelcomePage />} />

        {/* Register and save user info */}
        <Route path="/register" element={<Register />} />

        {/* Actual reporting tool (camera etc.) */}
        <Route path="/report" element={<App />} />

        {/* Municipality dashboard */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
