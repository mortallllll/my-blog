import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '管理面板',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {children}
    </div>
  );
}
