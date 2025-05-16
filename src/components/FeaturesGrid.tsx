
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeaturesGridProps {
  features: Feature[];
}

const FeaturesGrid = ({ features }: FeaturesGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
};

export default FeaturesGrid;
