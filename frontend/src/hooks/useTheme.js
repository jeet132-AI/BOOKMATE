import { useCallback, useEffect, useRef, useState } from "react";

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // storage unavailable — fall through to default
  }
  return "light";
}

export function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = value;
  try {
    localStorage.setItem("theme", value);
  } catch {
    // storage unavailable — theme still applies for this session
  }
  window.dispatchEvent(new CustomEvent("theme-change", { detail: value }));
}

/**
 * Shared theme state. Default is light; every instance stays in sync
 * through the `theme-change` event + storage events so the Navbar
 * toggle and the Login/Register floating toggle never disagree.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    const current = document?.documentElement?.dataset?.theme;
    if (current === "dark" || current === "light") return current;
    return getSavedTheme();
  });
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    // Only write when this instance's value differs from the document.
    // This keeps every hook instance in sync without event loops.
    if (document.documentElement.dataset.theme !== theme) {
      applyTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    function handleThemeChange(event) {
      const next = event?.detail;
      if ((next === "dark" || next === "light") && next !== themeRef.current) {
        setTheme(next);
      }
    }

    function handleStorage(event) {
      if (event.key === "theme" && (event.newValue === "dark" || event.newValue === "light")) {
        setTheme(event.newValue);
      }
    }

    window.addEventListener("theme-change", handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, darkMode: theme === "dark", setTheme, toggleTheme: toggle };
}
