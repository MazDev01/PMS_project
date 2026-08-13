import { AppShell } from "@/components/layout/app-shell";

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
