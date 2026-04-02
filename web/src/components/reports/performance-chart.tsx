"use client";

/* placeholder for recharts */
import type { InterviewSession } from "@/lib/api";

interface PerformanceChartProps {
  sessions: InterviewSession[];
}

export function PerformanceChart({ sessions }: PerformanceChartProps) {
  const data = sessions
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((session, index) => ({
      name: `Session ${index + 1}`,
      role: session.role,
      date: new Date(session.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No completed sessions yet. Complete an interview to see your chart!
      </div>
    );
  }

  return (
    <div className="h-80 flex items-center justify-center text-muted-foreground">
      <p>Performance chart will be available after evaluations are completed.</p>
    </div>
  );
}