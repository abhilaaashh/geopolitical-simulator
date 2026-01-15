import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Geopolitical Simulator | LLM-Powered Strategy Game',
  description: 'An immersive turn-based geopolitical simulation powered by AI. Choose your scenario, pick your role, and shape world history.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-game-bg text-white antialiased`}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
