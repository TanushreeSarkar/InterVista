"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, AlertCircle } from "lucide-react";
import type { Evaluation } from "@/lib/api";

interface FeedbackCardProps {
  evaluation: Evaluation;
  questionNumber: number;
}

export function FeedbackCard({ evaluation, questionNumber }: FeedbackCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">
              Question {questionNumber}
            </CardTitle>
            <p className="text-sm text-muted-foreground mb-4">
              {evaluation.feedback}
            </p>
          </div>
          <div className="text-right ml-4">
            <div className="text-3xl font-bold text-primary mb-1">
              {evaluation.score}
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>
        <Progress value={evaluation.score} className="h-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {evaluation.strengths.map((strength, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <h3 className="font-semibold">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {evaluation.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span className="text-sm">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}