import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yell into the Void',
  description: 'Yell into the void',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
