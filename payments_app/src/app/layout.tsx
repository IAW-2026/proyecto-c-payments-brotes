// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Sidebar from "@/components/layout/Sidebar";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Payments App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
