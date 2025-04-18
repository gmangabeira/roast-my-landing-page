
import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, MousePointer, LightbulbIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

interface CommentHighlightArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Comment {
  id: number;
  category: string;
  section?: string;
  highlightArea: CommentHighlightArea;
  issue: string;
  solution: string;
  example?: string;
}

interface CommentsPanelProps {
  comments: Comment[];
}

const CommentsPanel = ({ comments }: CommentsPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const categories = ['All', 'Clarity', 'CTAs', 'Copy', 'Design', 'Trust'];
  
  const filteredComments = selectedCategory === 'All' 
    ? comments 
    : comments.filter(comment => comment.category === selectedCategory);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🔥 Your Roast Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-brand-green hover:bg-brand-green/90" : ""}
            >
              {category}
            </Button>
          ))}
        </div>
        
        {/* Comments List */}
        <div className="space-y-4 overflow-auto flex-1 pr-1">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search size={32} className="mx-auto mb-2 opacity-30" />
              <p>No comments in this category</p>
            </div>
          ) : (
            filteredComments.map(comment => (
              <div key={comment.id} className="bg-gray-50 rounded-lg border p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium">
                    {comment.category}
                  </span>
                  {comment.section && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {comment.section}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-3 mb-3 items-start">
                  <XCircle size={18} className="text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1 text-sm">What's wrong</h4>
                    <p className="text-sm text-gray-700">{comment.issue}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mb-3 items-start">
                  <CheckCircle size={18} className="text-brand-green mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1 text-sm">Fix it fast</h4>
                    <p className="text-sm text-gray-700">{comment.solution}</p>
                  </div>
                </div>
                
                {comment.example && (
                  <div className="flex gap-3 items-start mt-3 pt-3 border-t border-gray-200">
                    <LightbulbIcon size={18} className="text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1 text-sm">Example fix</h4>
                      <p className="text-sm text-gray-600 bg-gray-100 p-2.5 rounded">{comment.example}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentsPanel;
