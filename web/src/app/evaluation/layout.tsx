import { ProtectedRoute } from "@/components/layout/protected-route";

export default function EvaluationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
