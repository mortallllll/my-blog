'use client';

import { useState, useRef, useEffect } from 'react';
import { useSettings } from '@/components/SettingsProvider';
import {
  NAVBAR_COLOR_PRESETS,
  NAVBAR_OPACITY_PRESETS,
  LEAF_COLOR_PRESETS,
  THEME_OPTIONS,
} from '@/lib/settings';

export default function SettingsPanel() {
  const {
    settings,
    updateNavbarColor,
    updateNavbarOpacity,
    updateLeafColor,
    updateTheme,
    resetSettings,
  } = useSettings();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Escape 关闭
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div className="relative">
      {/* 设置按钮 */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          open
            ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
        }`}
        title="设置"
        aria-label="打开设置面板"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* 下拉面板 */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-800 z-[100] max-h-[80vh] overflow-y-auto"
        >
          {/* 标题 */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              ⚙ 外观设置
            </h3>
            <button
              onClick={() => resetSettings()}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition dark:hover:text-zinc-300"
            >
              重置默认
            </button>
          </div>

          {/* === 主题模式 === */}
          <SectionLabel>主题模式</SectionLabel>
          <div className="flex gap-1.5 mb-5">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.mode}
                onClick={() => updateTheme(opt.mode)}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                  settings.theme === opt.mode
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700/50'
                }`}
              >
                <span className="block text-base mb-0.5">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {/* === 导航栏颜色 === */}
          <SectionLabel>导航栏颜色</SectionLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {NAVBAR_COLOR_PRESETS.map((preset) => (
              <ColorSwatch
                key={preset.color}
                color={preset.color}
                label={preset.name}
                active={settings.navbarColor === preset.color}
                onClick={() => updateNavbarColor(preset.color)}
              />
            ))}
            <CustomColorInput
              currentColor={settings.navbarColor}
              onChange={updateNavbarColor}
              id="navbar-color"
            />
          </div>

          {/* === 导航栏透明度 === */}
          <SectionLabel>导航栏透明度</SectionLabel>
          <div className="flex gap-1.5 mb-5">
            {NAVBAR_OPACITY_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => updateNavbarOpacity(preset.value)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                  settings.navbarOpacity === preset.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700/50'
                }`}
              >
                {preset.name}
                <span className="block text-[10px] opacity-60">{preset.value}%</span>
              </button>
            ))}
          </div>

          {/* === 树叶边框颜色 === */}
          <SectionLabel>树叶边框颜色</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {LEAF_COLOR_PRESETS.map((preset) => (
              <ColorSwatch
                key={preset.color}
                color={preset.color}
                label={preset.name}
                active={settings.leafColor === preset.color}
                onClick={() => updateLeafColor(preset.color)}
              />
            ))}
            <CustomColorInput
              currentColor={settings.leafColor}
              onChange={updateLeafColor}
              id="leaf-color"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** 区块标题 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block">
      {children}
    </label>
  );
}

/** 颜色色块 */
function ColorSwatch({
  color,
  label,
  active,
  onClick,
}: {
  color: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`h-7 w-7 rounded-full border-2 transition-all hover:scale-110 ${
        active
          ? 'border-blue-500 shadow-md scale-110 dark:border-blue-400'
          : 'border-zinc-200 dark:border-zinc-600'
      }`}
      style={{ backgroundColor: color }}
      aria-label={`${label}: ${color}`}
    />
  );
}

/** 自定义颜色输入（取色器） */
function CustomColorInput({
  currentColor,
  onChange,
  id,
}: {
  currentColor: string;
  onChange: (color: string) => void;
  id: string;
}) {
  const [pick, setPick] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setPick((v) => !v)}
        title="自定义颜色"
        className={`h-7 w-7 rounded-full border-2 border-dashed flex items-center justify-center text-xs transition-all hover:scale-110 ${
          pick
            ? 'border-blue-500 dark:border-blue-400'
            : 'border-zinc-300 dark:border-zinc-500'
        }`}
        style={{ backgroundColor: currentColor }}
        aria-label="自定义颜色"
      >
        <span className="text-zinc-400 dark:text-zinc-500">+</span>
      </button>
      {pick && (
        <div className="absolute top-full left-0 mt-1 z-[110]">
          <input
            type="color"
            id={id}
            value={currentColor}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setPick(false)}
            className="h-10 w-10 cursor-pointer rounded border border-zinc-200 dark:border-zinc-600"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
