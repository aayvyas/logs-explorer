import type { Metadata } from 'next';
import './globals.css';
import ThemeRegistry from '@/components/ThemeRegistry';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Logs Explorer',
  description: 'Advanced Cloud Logs Explorer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <ThemeRegistry>
          <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            {children}
          </div>
        </ThemeRegistry>
      </body>
    </html>
  );
}
