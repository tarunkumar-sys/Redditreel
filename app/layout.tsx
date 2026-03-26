import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ToastContext';
import SecurityInitializer from '@/components/SecurityInitializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Reddit Reel AI — Discover Videos You\'ll Love',
  description: 'AI-powered infinite scroll video feed from Reddit. Chat to search, discover, and watch the best video content curated just for you.',
  keywords: ['reddit', 'videos', 'reels', 'AI search', 'short videos', 'infinite scroll'],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Reddit Reel AI',
    description: 'AI-powered infinite scroll video feed from Reddit',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <SecurityInitializer />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
