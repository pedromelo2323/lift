import type { Metadata, Viewport } from "next";
import { BugReportButton } from "@/components/BugReportButton";
import { RestTimer } from "@/components/RestTimer";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lift",
  description: "A personal workout memory app.",
  applicationName: "Lift",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lift",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fcfcfb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-md bg-background">
          <Providers>
            {children}
          </Providers>
          <RestTimer />
          <BugReportButton />
        </main>
      </body>
    </html>
  );
}
