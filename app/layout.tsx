import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Sales KPI Dashboard",
  description: "Dashboard KPI premium per monitorare le performance del team vendite."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
