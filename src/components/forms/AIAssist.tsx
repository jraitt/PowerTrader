'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wand2, 
  DollarSign, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  FileText,
  Lightbulb
} from 'lucide-react';
import type { ItemCategoryType } from '@/types/item';

interface AIAssistProps {
  category: ItemCategoryType;
  manufacturer: string;
  model: string;
  condition: number;
  year?: number;
  additionalDetails?: string;
  onDescriptionGenerated: (description: string) => void;
  onPricingSuggested: (suggestions: {
    suggestedPrice: number;
    priceRange: { min: number; max: number };
    marketInsights: string[];
  }) => void;
  disabled?: boolean;
}

interface AssistState {
  isGeneratingDescription: boolean;
  isGettingPricing: boolean;
  generatedDescription: string | null;
  pricingSuggestions: {
    suggestedPrice: number;
    priceRange: { min: number; max: number };
    marketInsights: string[];
  } | null;
  errors: {
    description?: string | undefined;
    pricing?: string | undefined;
  };
}

export default function AIAssist({
  category,
  manufacturer,
  model,
  condition,
  year,
  additionalDetails,
  onDescriptionGenerated,
  onPricingSuggested,
  disabled = false
}: AIAssistProps) {
  const [state, setState] = useState<AssistState>({
    isGeneratingDescription: false,
    isGettingPricing: false,
    generatedDescription: null,
    pricingSuggestions: null,
    errors: {},
  });

  const canGenerateDescription = category && manufacturer && model && condition;
  const canGetPricing = category && manufacturer && model;

  const handleGenerateDescription = async () => {
    if (!canGenerateDescription) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, description: 'Please fill in category, manufacturer, model, and condition first' }
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isGeneratingDescription: true,
      errors: { ...prev.errors, description: '' },
      generatedDescription: null,
    }));

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          manufacturer,
          model,
          condition,
          additionalDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description');
      }

      const description = data.description as string;
      setState(prev => ({ ...prev, generatedDescription: description, isGeneratingDescription: false }));

    } catch (error) {
      console.error('Error generating description:', error);
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          description: error instanceof Error ? error.message : 'Failed to generate description'
        },
        isGeneratingDescription: false,
      }));
    }
  };

  const handleGetPricingSuggestions = async () => {
    if (!canGetPricing) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, pricing: 'Please fill in category, manufacturer, and model first' }
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isGettingPricing: true,
      errors: { ...prev.errors, pricing: '' },
      pricingSuggestions: null,
    }));

    try {
      const response = await fetch('/api/ai/pricing-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          manufacturer,
          model,
          year,
          condition,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get pricing suggestions');
      }

      const suggestions = data.pricingSuggestions;
      setState(prev => ({ ...prev, pricingSuggestions: suggestions, isGettingPricing: false }));

    } catch (error) {
      console.error('Error getting pricing suggestions:', error);
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          pricing: error instanceof Error ? error.message : 'Failed to get pricing suggestions'
        },
        isGettingPricing: false,
      }));
    }
  };

  const handleApplyDescription = () => {
    if (state.generatedDescription) {
      onDescriptionGenerated(state.generatedDescription);
    }
  };

  const handleApplyPricing = () => {
    if (state.pricingSuggestions) {
      onPricingSuggested(state.pricingSuggestions);
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        <Badge variant="secondary" className="text-xs">
          Smart Suggestions
        </Badge>
      </div>

      {/* Description Generation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">Generate Description</h4>
        </div>
        
        <p className="text-sm text-gray-600">
          Generate an engaging marketplace description based on your item details.
        </p>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerateDescription}
            disabled={disabled || state.isGeneratingDescription || !canGenerateDescription}
            variant={state.generatedDescription ? "outline" : "default"}
            className="flex items-center gap-2"
          >
            {state.isGeneratingDescription ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                {state.generatedDescription ? 'Regenerate' : 'Generate'} Description
              </>
            )}
          </Button>

          {!canGenerateDescription && (
            <span className="text-sm text-gray-500">
              Fill in required fields first
            </span>
          )}
        </div>

        {state.errors.description && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{state.errors.description}</p>
          </div>
        )}

        {state.generatedDescription && (
          <div className="p-4 bg-white border rounded-md space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Generated Description</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {state.generatedDescription}
            </p>
            <div className="flex justify-end">
              <Button onClick={handleApplyDescription} size="sm" className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Apply to Form
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Pricing Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">Smart Pricing</h4>
        </div>
        
        <p className="text-sm text-gray-600">
          Get AI-powered pricing suggestions based on market data and item condition.
        </p>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGetPricingSuggestions}
            disabled={disabled || state.isGettingPricing || !canGetPricing}
            variant={state.pricingSuggestions ? "outline" : "default"}
            className="flex items-center gap-2"
          >
            {state.isGettingPricing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Market...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                {state.pricingSuggestions ? 'Refresh' : 'Get'} Pricing Suggestions
              </>
            )}
          </Button>

          {!canGetPricing && (
            <span className="text-sm text-gray-500">
              Fill in required fields first
            </span>
          )}
        </div>

        {state.errors.pricing && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{state.errors.pricing}</p>
          </div>
        )}

        {state.pricingSuggestions && (
          <div className="p-4 bg-white border rounded-md space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Pricing Analysis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-gray-600 mb-1">Suggested Price</p>
                <p className="text-lg font-bold text-blue-700">
                  ${state.pricingSuggestions.suggestedPrice.toLocaleString()}
                </p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-md">
                <p className="text-xs text-gray-600 mb-1">Min Price</p>
                <p className="text-lg font-semibold text-green-700">
                  ${state.pricingSuggestions.priceRange.min.toLocaleString()}
                </p>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-md">
                <p className="text-xs text-gray-600 mb-1">Max Price</p>
                <p className="text-lg font-semibold text-orange-700">
                  ${state.pricingSuggestions.priceRange.max.toLocaleString()}
                </p>
              </div>
            </div>

            {state.pricingSuggestions.marketInsights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">Market Insights</span>
                </div>
                <div className="space-y-1">
                  {state.pricingSuggestions.marketInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-purple-600">•</span>
                      <span className="text-gray-700">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleApplyPricing} size="sm" className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Apply Suggested Price
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}