
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScorePanelProps {
  scores: {
    overall: number;
    visualHierarchy: number;
    valueProposition: number;
    ctaStrength: number;
    copyResonance: number;
    trustCredibility: number;
  };
}

const ScorePanel = ({ scores }: ScorePanelProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const scoreItems = [
    { label: "Visual Hierarchy", value: scores.visualHierarchy },
    { label: "Clarity of Value Proposition", value: scores.valueProposition },
    { label: "CTA Strength & Placement", value: scores.ctaStrength },
    { label: "Copy Resonance", value: scores.copyResonance },
    { label: "Trust & Credibility", value: scores.trustCredibility },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">CRO Scorecard</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {/* Overall Score */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <svg className="w-32 h-32" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#e2e8f0" 
                strokeWidth="10" 
              />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke={scores.overall >= 80 ? "#22C55E" : scores.overall >= 60 ? "#FACC15" : "#DC2626"} 
                strokeWidth="10" 
                strokeDasharray={`${scores.overall * 2.83} ${283 - scores.overall * 2.83}`} 
                strokeDashoffset="70.75" 
                transform="rotate(-90 50 50)" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-bold">{scores.overall}</span>
              <span className="text-xs text-gray-500">Overall Score</span>
            </div>
          </div>
        </div>

        {/* Individual Scores */}
        <div className="space-y-6">
          {scoreItems.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm font-medium">{item.value}/100</span>
              </div>
              <Progress value={item.value} className="h-2">
                <div 
                  className={`h-full ${getScoreColor(item.value)}`}
                  style={{ width: `${item.value}%` }}
                />
              </Progress>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t text-sm text-gray-600">
          <h4 className="font-medium mb-2">Score Breakdown</h4>
          <ul className="space-y-1">
            <li className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>80-100: Excellent</span>
            </li>
            <li className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>60-79: Good, with room for improvement</span>
            </li>
            <li className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>0-59: Needs significant work</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScorePanel;
