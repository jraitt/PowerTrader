import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Primitive Powersports - Quality ATVs, Snowmobiles & Small Engines',
  description: 'Your trusted source for quality ATVs, snowmobiles, lawn tractors, and utility trailers in the East. Browse our inventory of carefully inspected small engine machinery.',
  keywords: ['ATV', 'snowmobile', 'lawn tractor', 'utility trailer', 'small engine', 'powersports', 'primitive powersports'],
  authors: [{ name: 'Primitive Powersports' }],
  creator: 'Primitive Powersports',
  publisher: 'Primitive Powersports',
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
    title: 'Primitive Powersports - Quality ATVs, Snowmobiles & Small Engines',
    description: 'Your trusted source for quality ATVs, snowmobiles, lawn tractors, and utility trailers in the East. Browse our inventory of carefully inspected small engine machinery.',
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Primitive Powersports',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Primitive Powersports - Quality ATVs, Snowmobiles & Small Engines',
    description: 'Your trusted source for quality ATVs, snowmobiles, lawn tractors, and utility trailers in the East. Browse our inventory of carefully inspected small engine machinery.',
  },
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
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