'use client';

import { useMemo } from 'react';
import type { Post } from '@/lib/posts';
import {
  computeCalendarData,
  getMonthLabels,
  getLevelColor,
  formatDateCN,
  DAY_LABELS,
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
    const g = computeCalendarData(posts, 26);
    return { grid: g, monthLabels: getMonthLabels(g) };
  }, [posts]);

  if (grid[0].length === 0) return null;

  const weeks = grid[0].length;

  return (
    <div>
      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
        文章发布日历
      </h4>

      <div className="overflow-x-auto -mx-1">
        {/* 月份标签 */}
        <div className="mb-1 ml-7 flex text-[10px] text-zinc-400 dark:text-zinc-500">
          {monthLabels.map((ml, i) => {
            const prevCol = i > 0 ? monthLabels[i - 1].colIndex : 0;
            const gap = ml.colIndex - prevCol;
            return (
              <span
                key={ml.label}
                style={{
                  marginLeft: i === 0 ? ml.colIndex * 15 : (gap - 1) * 15,
                }}
                className="whitespace-nowrap"
              >
                {ml.label}
              </span>
            );
          })}
        </div>

        <div className="flex gap-0.5">
          {/* 星期标签 */}
          <div className="flex flex-col gap-0.5 mr-1 pt-0">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="flex h-[13px] w-5 items-center justify-end text-[9px] text-zinc-300 dark:text-zinc-600"
                style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="flex gap-0.5">
            {Array.from({ length: weeks }, (_, w) => (
              <div key={w} className="flex flex-col gap-0.5">
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
                      className={`h-[13px] w-[13px] rounded-[2px] ${getLevelColor(
                        day.level
                      )} ${
                        isActive
                          ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-blue-400'
                          : ''
                      } ${
                        clickable
                          ? 'cursor-pointer hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500'
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
      </div>

      {/* 图例 */}
      <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
        <span>少</span>
        <div className={`h-2.5 w-2.5 rounded-sm ${getLevelColor(0)}`} />
        <div className={`h-2.5 w-2.5 rounded-sm ${getLevelColor(1)}`} />
        <div className={`h-2.5 w-2.5 rounded-sm ${getLevelColor(2)}`} />
        <div className={`h-2.5 w-2.5 rounded-sm ${getLevelColor(3)}`} />
        <span>多</span>

        {activeDate && (
          <button
            onClick={() => onDateChange('')}
            className="ml-auto text-blue-500 hover:underline"
          >
            清除日期
          </button>
        )}
      </div>
    </div>
  );
}
