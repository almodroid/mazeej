import { createContext, useState, useContext, useEffect, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: ReactNode;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get the theme from localStorage
    const savedTheme = localStorage.getItem("theme") as Theme;
    // If a theme was saved and it's valid, use it
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      return savedTheme;
    }
    // Otherwise default to system
    return "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous classes
    root.classList.remove("light", "dark");
    
    // Apply the theme
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Save theme to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Watch for system theme changes
  useEffect(() => {
    if (theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(mediaQuery.matches ? "dark" : "light");
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
} 