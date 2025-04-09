
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings2 } from 'lucide-react';

interface ContextFormProps {
  pageGoal: string;
  setPageGoal: (value: string) => void;
  audience: string;
  setAudience: (value: string) => void;
  brandTone: string;
  setBrandTone: (value: string) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

const ContextForm: React.FC<ContextFormProps> = ({
  pageGoal,
  setPageGoal,
  audience,
  setAudience,
  brandTone,
  setBrandTone,
  expanded,
  setExpanded,
}) => {
  return (
    <div className="w-full mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-green transition-colors"
      >
        <Settings2 size={16} />
        <span>{expanded ? 'Hide' : 'Show'} Optional Settings</span>
      </button>
      
      {expanded && (
        <div className="border rounded-lg p-4 mt-3 bg-gray-50/50 space-y-4">
          <div>
            <label htmlFor="pageGoal" className="block text-sm font-medium text-gray-700 mb-1">
              Landing Page Goal
            </label>
            <Input
              id="pageGoal"
              placeholder="e.g., Get demo signups, newsletter subscriptions"
              value={pageGoal}
              onChange={(e) => setPageGoal(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience
            </label>
            <Input
              id="audience"
              placeholder="e.g., SaaS founders, marketing directors"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="brandTone" className="block text-sm font-medium text-gray-700 mb-1">
              Brand Voice & Tone
            </label>
            <Textarea
              id="brandTone"
              placeholder="e.g., Professional but conversational, technical but approachable"
              value={brandTone}
              onChange={(e) => setBrandTone(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
          
          <p className="text-xs text-gray-500 italic">
            Adding these details will help our AI provide more targeted and relevant feedback
          </p>
        </div>
      )}
    </div>
  );
};

export default ContextForm;
