"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme } from "@/lib/types";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 从localStorage获取主题设置
    const savedTheme = localStorage.getItem("langchain-chat-theme") as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // 检查系统主题偏好
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setThemeState(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // 更新HTML类名
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // 保存到localStorage
    localStorage.setItem("langchain-chat-theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // 避免服务端渲染不匹配
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: "light",
          toggleTheme: () => {},
          setTheme: () => {},
        }}
      >
        <div className="opacity-0">{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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
