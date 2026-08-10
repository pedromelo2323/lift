import type { Metadata, Viewport } from "next";
import { BugReportButton } from "@/components/BugReportButton";
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
          <BugReportButton />
        </main>
      </body>
    </html>
  );
}
