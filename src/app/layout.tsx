import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, MobileHeader } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Logger",
  description: "Logger application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <MobileHeader />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

