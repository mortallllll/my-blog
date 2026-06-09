/**
 * 应用设置类型、预设颜色和工具函数
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  navbarColor: string;
  navbarOpacity: number; // 0-100
  leafColor: string;
  theme: ThemeMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
  navbarColor: '#ffffff',
  navbarOpacity: 55,
  leafColor: '#8b9e7c',
  theme: 'system',
};

/** 导航栏颜色预设 */
export const NAVBAR_COLOR_PRESETS = [
  { name: '纯白', color: '#ffffff' },
  { name: '奶油米', color: '#faf6f0' },
  { name: '淡茶色', color: '#f0ebe0' },
  { name: '浅灰蓝', color: '#eef0f3' },
  { name: '墨灰', color: '#2d3035' },
];

/** 导航栏透明度快捷选项 */
export const NAVBAR_OPACITY_PRESETS = [
  { name: '不透明', value: 100 },
  { name: '半透明', value: 55 },
  { name: '透明', value: 25 },
];

/** 主题模式选项 */
export const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: '亮色', icon: '☀' },
  { mode: 'dark', label: '暗色', icon: '🌙' },
  { mode: 'system', label: '跟随系统', icon: '💻' },
];

/** 树叶边框颜色预设 */
export const LEAF_COLOR_PRESETS = [
  { name: '鼠尾草绿', color: '#8b9e7c' },
  { name: '橄榄金', color: '#b8a86a' },
  { name: '深苔绿', color: '#5a7a5c' },
  { name: '秋枫棕', color: '#b8956a' },
  { name: '暗玫红', color: '#a67c7d' },
  { name: '墨蓝灰', color: '#6b7d8a' },
];

/** 解析 hex 颜色为 RGB 分量 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** RGB 转 hex */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

/** 将 hex 颜色 + 透明度转为 rgba 字符串 */
export function hexToRgba(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  const alpha = Math.max(0, Math.min(1, opacity / 100));
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

/** 计算颜色亮度 (0-255)，用于判断浅/深色 */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** 将颜色调暗指定比例 (factor: 0-1, 越小越暗) */
export function darkenColor(hex: string, factor: number = 0.6): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}

/** 将颜色调亮 */
export function lightenColor(hex: string, factor: number = 1.3): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    Math.min(255, r * factor),
    Math.min(255, g * factor),
    Math.min(255, b * factor),
  );
}

/** 根据叶子主色自动计算衍生色（叶脉、藤蔓、点缀色） */
export function computeLeafDerivedColors(leafColor: string) {
  return {
    leafFill: leafColor,
    leafStroke: darkenColor(leafColor, 0.75),
    vineColor: darkenColor(leafColor, 0.65),
    leafAccent: lightenColor(leafColor, 1.15),
    leafFillDark: darkenColor(leafColor, 0.55),
    leafStrokeDark: darkenColor(leafColor, 0.4),
    vineColorDark: darkenColor(leafColor, 0.35),
    leafAccentDark: darkenColor(leafColor, 0.7),
  };
}

/** 根据导航栏颜色计算暗色模式版本 */
export function computeNavbarDarkColor(navbarColor: string): string {
  const lum = luminance(navbarColor);
  if (lum < 50) {
    return darkenColor(navbarColor, 0.8);
  }
  return darkenColor(navbarColor, 0.25);
}
