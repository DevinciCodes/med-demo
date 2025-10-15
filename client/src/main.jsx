import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// <<<<<<< HEAD

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <App />
// =======
import { AuthProvider } from "./context/AuthContext";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
{/* >>>>>>> 8c76dcd (added provider dashboard and prescription page, bypassed firebase) */}
  </React.StrictMode>
);
