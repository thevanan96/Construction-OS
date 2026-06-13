import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { AuthWrapper } from '@/components/AuthWrapper';

export const metadata: Metadata = {
  title: 'SiteTrack',
  description: 'Manage construction employees, site attendance, daily hours, and payments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
