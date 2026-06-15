import { Suspense } from 'react';
import { getAllBooks } from '@/lib/books';
import BooksPageClient from './BooksPageClient';

export const dynamic = 'force-dynamic';

export default async function BooksPage() {
  const allBooks = await getAllBooks();

  return (
    <Suspense fallback={null}>
      <BooksPageClient allBooks={allBooks} />
    </Suspense>
  );
}
