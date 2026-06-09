import type { Post } from '@/lib/posts';

/** 日历中一天的数据 */
export interface CalendarDay {
  date: string;   // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3;
}

/** Date → 本地时区 YYYY-MM-DD 字符串（避免 UTC 时区偏移） */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 由文章列表计算出每日发文数量并映射为热度等级 */
export function computeCalendarData(
  posts: Post[],
  weeks: number = 26
): CalendarDay[][] {
  // 统计每日文章数
  const countMap = new Map<string, number>();
  for (const post of posts) {
    const d = post.meta.date;
    countMap.set(d, (countMap.get(d) || 0) + 1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 对齐到今天所在周的周六（日历最后一列是当前周）
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));

  // 从 end 往前推 N 周到周日（日历第一列）
  const start = new Date(end);
  start.setDate(start.getDate() - weeks * 7 + 1);

  const grid: CalendarDay[][] = Array.from({ length: 7 }, () => []);

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + w * 7 + d);
      const dateStr = toLocalDateStr(date);
      const count = countMap.get(dateStr) || 0;

      let level: 0 | 1 | 2 | 3;
      if (count === 0) level = 0;
      else if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else level = 3;

      const isFuture = date > today;
      grid[d].push({
        date: dateStr,
        count,
        level: isFuture ? 0 : level,
      });
    }
  }

  return grid;
}

/** 从 grid 中提取月份标签：[{ label, colIndex }] */
export interface MonthLabel {
  label: string;
  colIndex: number;
}

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

export function getMonthLabels(grid: CalendarDay[][]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  if (grid[0].length === 0) return labels;

  const weeks = grid[0].length;
  let lastMonth = -1;

  for (let w = 0; w < weeks; w++) {
    // 取每周第一天（周日）的月份
    const dateStr = grid[0][w].date; // day 0 = Sunday
    const month = parseInt(dateStr.split('-')[1], 10) - 1;

    if (month !== lastMonth) {
      labels.push({ label: MONTH_NAMES[month], colIndex: w });
      lastMonth = month;
    }
  }

  return labels;
}

/** 简短星期标签（单字） */
export const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

/** 根据等级返回 Tailwind 颜色类 */
export function getLevelColor(level: 0 | 1 | 2 | 3): string {
  switch (level) {
    case 0:
      return 'bg-zinc-200 dark:bg-zinc-700';
    case 1:
      return 'bg-green-200 dark:bg-green-800';
    case 2:
      return 'bg-green-400 dark:bg-green-600';
    case 3:
      return 'bg-green-600 dark:bg-green-400';
  }
}

/** 格式化中文日期 */
export function formatDateCN(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}年${m}月${day}日`;
}
