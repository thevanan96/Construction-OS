import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { AuthWrapper } from '@/components/AuthWrapper';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FieldMetrik',
  description: 'Manage construction employees, site attendance, daily hours, and payments.',
  icons: {
    icon: '/fieldmetrik-mark.png',
    shortcut: '/fieldmetrik-mark.png',
    apple: '/fieldmetrik-mark.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AppProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
