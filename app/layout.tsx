import '@/styles/globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Insurance Claims Analyzer',
  description: 'Upload and analyze insurance claims with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js" 
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
} 