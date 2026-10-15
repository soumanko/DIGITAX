import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'DIGITAX — GST Bookkeeping & Filing Preparation for Indian Small Businesses',
    template: '%s | DIGITAX',
  },
  description:
    'DIGITAX helps Indian small businesses, kirana stores, and retailers organize invoices, reconcile payments, calculate GST, and prepare filing data. AI-powered bookkeeping made simple.',
  keywords: [
    'GST bookkeeping',
    'GST filing preparation',
    'invoice management India',
    'small business accounting India',
    'kirana store GST',
    'UPI reconciliation',
    'input tax credit',
    'GST software India',
  ],
  authors: [{ name: 'DIGITAX' }],
  creator: 'DIGITAX',
  publisher: 'DIGITAX',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'DIGITAX',
    title: 'DIGITAX — GST Bookkeeping & Filing Preparation for Indian Small Businesses',
    description:
      'Organize invoices, reconcile UPI payments, calculate GST summaries, and prepare filing data with AI-assisted bookkeeping.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DIGITAX — AI-Powered GST Bookkeeping',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DIGITAX — GST Bookkeeping for Indian Small Businesses',
    description:
      'AI-powered bookkeeping, invoice management, and GST filing preparation.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* JSON-LD Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'DIGITAX',
              url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              description:
                'AI-powered GST bookkeeping and filing preparation platform for Indian small businesses.',
              sameAs: [],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-surface antialiased">
        {children}
      </body>
    </html>
  );
}
