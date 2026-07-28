import { useEffect, useState } from "react";

const STORAGE_KEY = "cloudlens-theme";

const getInitialTheme = () => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

// Each page mounts its own <Navbar/> (and therefore its own useTheme call),
// but since the actual state lives in the DOM (`.dark` on <html>) and
// localStorage rather than React state, the theme stays in sync across
// route changes without needing a shared context/provider.
export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
};
