import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import VintageLeafBorder from '@/components/VintageLeafBorder';
import { SettingsProvider } from '@/components/SettingsProvider';
import { NavbarClient } from '@/components/NavbarClient';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: '我的博客',
    template: '%s | 我的博客',
  },
  description: '分享技术和生活的个人博客',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SettingsProvider>
          <VintageLeafBorder />

          {/* Navbar */}
          <header className="sticky top-0 z-50 border-b border-zinc-200 navbar-dynamic backdrop-blur-md dark:border-zinc-800">
            <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
              <Link
                href="/"
                className="text-lg font-bold text-zinc-900 hover:text-blue-600 transition dark:text-zinc-100 dark:hover:text-blue-400"
              >
                📝 WELCOME TO KONGYU'S BLOG
              </Link>
              <nav className="flex items-center gap-3 text-sm">
                <Link
                  href="/"
                  className="text-zinc-600 hover:text-zinc-900 transition dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  首页
                </Link>
                <Link
                  href="/admin"
                  className="text-zinc-400 hover:text-zinc-600 transition dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  管理
                </Link>
                <NavbarClient />
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-zinc-200 bg-white py-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              © {new Date().getFullYear()} 我的博客 · Powered by Next.js
            </p>
          </footer>
        </SettingsProvider>
      </body>
    </html>
  );
}
