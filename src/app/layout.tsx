import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PowerTrader - Buy / Sell the East',
  description: 'AI-powered inventory management system for small engine machinery trading',
  keywords: ['inventory', 'machinery', 'ATV', 'snowmobile', 'trailer', 'trading'],
  authors: [{ name: 'PowerTrader Team' }],
  creator: 'PowerTrader',
  publisher: 'PowerTrader',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3040'),
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'PowerTrader - Buy / Sell the East',
    description: 'AI-powered inventory management system for small engine machinery trading',
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'PowerTrader',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PowerTrader - Buy / Sell the East',
    description: 'AI-powered inventory management system for small engine machinery trading',
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <div id="root">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}