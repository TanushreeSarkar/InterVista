import { ProtectedRoute } from "@/components/layout/protected-route";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
