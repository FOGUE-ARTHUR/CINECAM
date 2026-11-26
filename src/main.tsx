import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

// Import CSS
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/outfit/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./style.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
const router = getRouter();

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
