import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import DemoBanner from "@/components/DemoBanner";
import { ThemeProvider } from "@/components/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Operations Platform | Student Event Management",
  description: "Operations and Event Management Platform for Student Organizations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('csi_theme');
                if (t === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-csi-bg text-csi-text flex text-[18px] transition-colors duration-200`}>
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 ml-60 px-8 py-8 transition-colors duration-200">
            <DemoBanner />
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
