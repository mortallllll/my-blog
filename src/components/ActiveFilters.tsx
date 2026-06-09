import Link from 'next/link';
import { formatDateCN } from '@/lib/calendar';

interface Props {
  search?: string;
  tag?: string;
  date?: string;
}

/** 构建去掉某个参数的 URL */
function removeParam(
  current: { search?: string; tag?: string; date?: string },
  key: string
): string {
  const params = new URLSearchParams();
  if (current.search && key !== 'search') params.set('search', current.search);
  if (current.tag && key !== 'tag') params.set('tag', current.tag);
  if (current.date && key !== 'date') params.set('date', current.date);
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

/** 清除所有参数 */
function clearAllUrl(): string {
  return '/';
}

export default function ActiveFilters({ search, tag, date }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">筛选：</span>

      {search && (
        <FilterTag label={`搜索: ${search}`} href={removeParam({ search, tag, date }, 'search')} />
      )}
      {tag && (
        <FilterTag label={`标签: ${tag}`} href={removeParam({ search, tag, date }, 'tag')} />
      )}
      {date && (
        <FilterTag
          label={`日期: ${formatDateCN(date)}`}
          href={removeParam({ search, tag, date }, 'date')}
        />
      )}

      {/* 清除全部 */}
      <Link
        href={clearAllUrl()}
        className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-1"
      >
        清除全部
      </Link>
    </div>
  );
}

function FilterTag({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
    >
      {label}
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </Link>
  );
}
