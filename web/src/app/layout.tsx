import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "GPT Control · Trung tâm vận hành AI",
  description: "Quản trị tài khoản, API và nội dung AI tập trung",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#080b12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <Toaster position="top-center" richColors offset={48} />
        <main className="app-shell min-h-screen overflow-x-hidden">
          <div className="flex min-h-screen w-full flex-col">
            <TopNav />
            <div className="min-w-0 flex-1">
              <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-5 lg:px-6 lg:py-5">
                {children}
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
