import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--glass-strong-bg)",
              color: "rgb(var(--color-white-rgb))",
              border: "1px solid var(--glass-border)",
              backdropFilter: "blur(20px)",
              borderRadius: "12px",
              fontSize: "13.5px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: "var(--glass-strong-shadow)",
            },
            success: {
              iconTheme: { primary: "#4ade80", secondary: "transparent" },
            },
            error: {
              iconTheme: { primary: "#f87171", secondary: "transparent" },
            },
          }}
        />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
