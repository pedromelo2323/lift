import type { Metadata, Viewport } from "next";
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
  themeColor: "#FAFAFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-lg px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
          {children}
        </main>
      </body>
    </html>
  );
}
