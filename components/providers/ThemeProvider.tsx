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

  // 立即执行的调试日志
  console.log("🎨 ThemeProvider 组件已创建");

  useEffect(() => {
    setMounted(true);

    try {
      // 从localStorage获取主题设置
      const savedTheme = localStorage.getItem("langchain-chat-theme") as Theme;
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      console.log("🎨 ThemeProvider 初始化:", {
        savedTheme,
        prefersDark,
        currentTheme: theme,
      });

      if (savedTheme) {
        setThemeState(savedTheme);
        console.log("✅ 使用保存的主题:", savedTheme);
      } else {
        // 检查系统主题偏好
        const systemTheme = prefersDark ? "dark" : "light";
        setThemeState(systemTheme);
        console.log("✅ 使用系统主题:", systemTheme);
      }
    } catch (error) {
      console.error("❌ ThemeProvider 初始化失败:", error);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      // 更新HTML类名
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);

      // 保存到localStorage
      localStorage.setItem("langchain-chat-theme", theme);

      // 调试日志
      console.log("🎨 主题已切换:", {
        theme,
        htmlClasses: root.className,
        localStorage: localStorage.getItem("langchain-chat-theme"),
        computedStyle: window.getComputedStyle(root).backgroundColor,
      });

      // 验证类名是否正确应用
      const hasThemeClass = root.classList.contains(theme);
      console.log("✅ 主题类名验证:", {
        expectedTheme: theme,
        hasThemeClass,
        allClasses: Array.from(root.classList),
      });
    } catch (error) {
      console.error("❌ 主题切换失败:", error);
    }
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
