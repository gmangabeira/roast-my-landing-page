
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import FeaturesGrid from '../FeaturesGrid';

interface ReportSectionProps {
  title: string;
  icon: React.ReactNode;
  score: number;
  description: string;
  checklistItems: {
    item: string;
    isPassing: boolean;
    explanation: string;
  }[];
}

const ReportSection = ({ title, icon, score, description, checklistItems }: ReportSectionProps) => {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };
  
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="bg-gray-100 p-2 rounded-full">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Score Circle */}
          <div className="md:w-1/3 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="10"
                />
                {/* Score circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={score >= 80 ? "#22C55E" : score >= 60 ? "#FACC15" : "#DC2626"}
                  strokeWidth="10"
                  strokeDasharray={`${score * 2.83} ${283 - score * 2.83}`}
                  strokeDashoffset="70.75"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
                <span className="text-xs text-gray-500">/100</span>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-gray-600">{description}</p>
          </div>
          
          {/* Checklist */}
          <div className="md:w-2/3">
            <FeaturesGrid checklistItems={checklistItems} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportSection;
