'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  type AppSettings,
  type ThemeMode,
  DEFAULT_SETTINGS,
  computeLeafDerivedColors,
  computeNavbarDarkColor,
  hexToRgba,
} from '@/lib/settings';

const STORAGE_KEY = 'blog-app-settings';
const STYLE_ID = 'app-settings-styles';

interface SettingsContextValue {
  settings: AppSettings;
  updateNavbarColor: (color: string) => void;
  updateNavbarOpacity: (opacity: number) => void;
  updateLeafColor: (color: string) => void;
  updateTheme: (theme: ThemeMode) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        navbarColor: parsed.navbarColor || DEFAULT_SETTINGS.navbarColor,
        navbarOpacity:
          typeof parsed.navbarOpacity === 'number'
            ? parsed.navbarOpacity
            : DEFAULT_SETTINGS.navbarOpacity,
        leafColor: parsed.leafColor || DEFAULT_SETTINGS.leafColor,
        theme: parsed.theme || DEFAULT_SETTINGS.theme,
      };
    }
  } catch {
    // 解析失败则回退默认
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 静默失败
  }
}

/** 根据主题模式设置 data-theme 属性 */
function applyThemeAttribute(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;

  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    html.setAttribute('data-theme', 'light');
  } else {
    html.removeAttribute('data-theme');
  }
}

/* 亮色 / 暗色背景值常量 */
const LIGHT_BG = '#ffffff';
const LIGHT_FG = '#171717';
const DARK_BG = '#0a0a0a';
const DARK_FG = '#ededed';

/**
 * 注入 <style> 标签设置 CSS 变量。
 *
 * 策略：
 * - :root 始终包含亮色变量值（--background, --foreground, 树叶, 导航栏）
 * - 暗色变量通过 @media 查询（system 模式）或 [data-theme] 选择器（强制模式）覆盖
 * - 同时设置 --background / --foreground，确保 body 等元素正确切换背景色
 */
function injectStyleTag(settings: AppSettings): void {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  const leaf = computeLeafDerivedColors(settings.leafColor);
  const navbarDark = computeNavbarDarkColor(settings.navbarColor);
  const navbarBg = hexToRgba(settings.navbarColor, settings.navbarOpacity);
  const navbarBgDark = hexToRgba(navbarDark, settings.navbarOpacity);

  let darkBlock: string;

  if (settings.theme === 'system') {
    /* 跟随系统：通过 @media 查询自动切换 */
    darkBlock = `
    @media (prefers-color-scheme: dark) {
      :root {
        --background: ${DARK_BG};
        --foreground: ${DARK_FG};
        --navbar-bg: ${navbarBgDark};
        --leaf-fill: ${leaf.leafFillDark};
        --leaf-stroke: ${leaf.leafStrokeDark};
        --vine-color: ${leaf.vineColorDark};
        --leaf-accent: ${leaf.leafAccentDark};
      }
    }`;
  } else if (settings.theme === 'dark') {
    /* 强制暗色：直接在 :root 设置暗色值 */
    darkBlock = `
    :root {
      --background: ${DARK_BG};
      --foreground: ${DARK_FG};
    }`;
  } else {
    /* 强制亮色：保持默认亮色值，不追加暗色覆盖 */
    darkBlock = '';
  }

  styleEl.textContent = `
    :root {
      --background: ${settings.theme === 'dark' ? DARK_BG : LIGHT_BG};
      --foreground: ${settings.theme === 'dark' ? DARK_FG : LIGHT_FG};
      --navbar-bg: ${settings.theme === 'dark' ? navbarBgDark : navbarBg};
      --leaf-fill: ${settings.theme === 'dark' ? leaf.leafFillDark : leaf.leafFill};
      --leaf-stroke: ${settings.theme === 'dark' ? leaf.leafStrokeDark : leaf.leafStroke};
      --vine-color: ${settings.theme === 'dark' ? leaf.vineColorDark : leaf.vineColor};
      --leaf-accent: ${settings.theme === 'dark' ? leaf.leafAccentDark : leaf.leafAccent};
    }
${darkBlock}`;
}

function removeStyleTag(): void {
  if (typeof document === 'undefined') return;
  const styleEl = document.getElementById(STYLE_ID);
  if (styleEl) {
    styleEl.remove();
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // 客户端挂载后从 localStorage 加载
  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);
    applyThemeAttribute(stored.theme);
    injectStyleTag(stored);
    setMounted(true);

    return () => {
      removeStyleTag();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 设置变更时持久化并更新样式
  useEffect(() => {
    if (!mounted) return;
    saveSettings(settings);
    applyThemeAttribute(settings.theme);
    injectStyleTag(settings);
  }, [settings, mounted]);

  const updateNavbarColor = useCallback((color: string) => {
    setSettings((prev) => ({ ...prev, navbarColor: color }));
  }, []);

  const updateNavbarOpacity = useCallback((opacity: number) => {
    setSettings((prev) => ({ ...prev, navbarOpacity: opacity }));
  }, []);

  const updateLeafColor = useCallback((color: string) => {
    setSettings((prev) => ({ ...prev, leafColor: color }));
  }, []);

  const updateTheme = useCallback((theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateNavbarColor,
        updateNavbarOpacity,
        updateLeafColor,
        updateTheme,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a <SettingsProvider>');
  }
  return ctx;
}
