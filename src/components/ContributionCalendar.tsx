'use client';

import { useMemo } from 'react';
import type { Post } from '@/lib/posts';
import {
  computeCalendarData,
  getMonthLabels,
  getLevelColor,
  formatDateCN,
} from '@/lib/calendar';

interface Props {
  posts: Post[];
  activeDate: string;
  onDateChange: (date: string) => void;
}

export default function ContributionCalendar({
  posts,
  activeDate,
  onDateChange,
}: Props) {
  const { grid, monthLabels } = useMemo(() => {
    const g = computeCalendarData(posts, 16);
    return { grid: g, monthLabels: getMonthLabels(g) };
  }, [posts]);

  if (grid[0].length === 0) return null;

  return (
    <div>
      {/* 月份标签 */}
      <div className="mb-1 ml-6 flex text-[10px] text-zinc-400 dark:text-zinc-500">
        {monthLabels.map((ml, i) => {
          const prevCol = i > 0 ? monthLabels[i - 1].colIndex : 0;
          const gap = ml.colIndex - prevCol;
          return (
            <span
              key={ml.label}
              style={{
                marginLeft: i === 0 ? ml.colIndex * 12.5 : (gap - 1) * 12.5,
              }}
              className="whitespace-nowrap"
            >
              {ml.label}
            </span>
          );
        })}
      </div>

      {/* 日历主体 */}
      <div className="flex gap-[1.5px]">
        {/* 星期标签 */}
        <div className="flex flex-col gap-[1.5px] mr-0.5 pt-0">
          {['', '一', '', '三', '', '五', ''].map((label, i) => (
            <div
              key={i}
              className="flex h-[11px] w-4 items-center justify-end text-[8px] text-zinc-300 dark:text-zinc-600"
            >
              {label}
            </div>
          ))}
        </div>

        {/* 格子 */}
        {Array.from({ length: grid[0].length }, (_, w) => (
          <div key={w} className="flex flex-col gap-[1.5px]">
            {grid.map((dayRow, d) => {
              const day = dayRow[w];
              const isActive = activeDate === day.date;
              const isFuture =
                new Date(day.date + 'T00:00:00') > new Date();
              const clickable = !isFuture && day.count > 0;

              return (
                <button
                  key={`${w}-${d}`}
                  onClick={() => {
                    if (!clickable) return;
                    onDateChange(isActive ? '' : day.date);
                  }}
                  disabled={!clickable}
                  className={`h-[11px] w-[11px] rounded-sm ${getLevelColor(
                    day.level
                  )} ${
                    isActive
                      ? 'ring-1 ring-blue-500 ring-offset-1 dark:ring-blue-400'
                      : ''
                  } ${
                    clickable
                      ? 'cursor-pointer hover:ring-1 hover:ring-zinc-400'
                      : 'cursor-default'
                  }`}
                  title={
                    isFuture
                      ? formatDateCN(day.date)
                      : `${formatDateCN(day.date)}${
                          day.count > 0
                            ? ` · ${day.count} 篇文章`
                            : ' · 无文章'
                        }`
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
