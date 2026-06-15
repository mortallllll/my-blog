'use client';

import { useState } from 'react';
import type { Book } from '@/lib/books';

interface BookCardProps {
  book: Book;
}

const STATUS_LABELS: Record<string, string> = {
  done: '已读',
  reading: '在读',
  want: '想读',
};

const STATUS_DOTS: Record<string, string> = {
  done: '🟢',
  reading: '🔵',
  want: '🟡',
};

export default function BookCard({ book }: BookCardProps) {
  const { meta } = book;
  const [imgError, setImgError] = useState(false);

  const ratingStars = Array.from({ length: 5 }, (_, i) =>
    i < meta.rating ? '★' : '☆'
  ).join('');

  return (
    <div className="group rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800">
      {/* Cover area */}
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-100 dark:bg-zinc-700">
        {meta.cover && !imgError ? (
          <img
            src={meta.cover}
            alt={book.slug}
            className="h-full w-full object-cover transition group-hover:scale-105 duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-zinc-400 dark:text-zinc-500">
            📖
          </div>
        )}

        {/* Recommend ribbon */}
        {meta.recommend && (
          <div className="absolute top-0 left-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-0.5 shadow-sm">
            精选
          </div>
        )}

        {/* Status badge */}
        <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm dark:bg-white/20">
          {STATUS_DOTS[meta.status]} {STATUS_LABELS[meta.status] || meta.status}
        </span>
      </div>

      {/* Info area */}
      <div className="p-4 space-y-2">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {book.slug}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {meta.author}
        </p>

        {/* Rating */}
        <div className="text-sm tracking-wider text-amber-400" aria-label={`${meta.rating} 星`}>
          {ratingStars}
        </div>

        {/* Review */}
        {meta.review && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {meta.review}
          </p>
        )}

        {/* Tags */}
        {meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {meta.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
