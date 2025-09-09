import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import App from "./App";
import "./index.css";

// Ensure light mode by default and remove any dark classes
function AppWithTheme() {
  useEffect(() => {
    // Remove any dark classes that might have been applied
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    
    // Force light mode
    document.documentElement.style.colorScheme = 'light';
  }, []);
  
  return <App />;
}

createRoot(document.getElementById("root")!).render(<AppWithTheme />);
