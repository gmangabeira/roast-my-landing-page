
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Checklist {
  item: string;
  isPassing: boolean;
  explanation: string;
}

interface FeaturesGridProps {
  features?: Feature[];
  checklistItems?: Checklist[];
  columns?: number;
}

const FeaturesGrid = ({ features, checklistItems, columns = 3 }: FeaturesGridProps) => {
  if (features) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
        {features.map((feature, index) => (
          <Card key={index} className="border bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="mb-4 bg-brand-green/10 w-12 h-12 rounded-full flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (checklistItems) {
    return (
      <div className="space-y-4">
        {checklistItems.map((item, index) => (
          <div key={index} className="flex gap-3 border-b pb-3 last:border-b-0">
            <div className="mt-0.5">
              {item.isPassing ? (
                <CheckCircle size={20} className="text-brand-green" />
              ) : (
                <XCircle size={20} className="text-red-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{item.item}</p>
              <p className="text-xs text-gray-600 mt-1">{item.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default FeaturesGrid;
