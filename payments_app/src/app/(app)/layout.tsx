// app/(app)/layout.tsx
import { UserBar } from "@/components/layout/UserBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UserBar />
      {children}
    </>
  );
}
