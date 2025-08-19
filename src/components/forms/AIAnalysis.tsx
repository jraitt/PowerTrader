'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Brain, Loader2, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import type { AIAnalysisResult } from '@/types/item';

interface AIAnalysisProps {
  photos: File[];
  onAnalysisComplete: (analysis: AIAnalysisResult) => void;
  disabled?: boolean;
}

interface AnalysisState {
  isAnalyzing: boolean;
  result: AIAnalysisResult | null;
  error: string | null;
}

export default function AIAnalysis({ photos, onAnalysisComplete, disabled = false }: AIAnalysisProps) {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    result: null,
    error: null,
  });

  const handleAnalyze = async () => {
    if (!photos.length) {
      setState(prev => ({ ...prev, error: 'Please upload at least one photo first' }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null, result: null }));

    try {
      const formData = new FormData();
      photos.forEach(photo => {
        formData.append('photos', photo);
      });

      const response = await fetch('/api/ai/analyze-photos', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze photos');
      }

      const analysis = data.analysis as AIAnalysisResult;
      setState(prev => ({ ...prev, result: analysis, isAnalyzing: false }));
      
      // Notify parent component
      onAnalysisComplete(analysis);

    } catch (error) {
      console.error('Error analyzing photos:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to analyze photos',
        isAnalyzing: false,
      }));
    }
  };

  const handleApplyAnalysis = () => {
    if (state.result) {
      onAnalysisComplete(state.result);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConditionColor = (condition: number) => {
    if (condition >= 8) return 'bg-green-100 text-green-800';
    if (condition >= 6) return 'bg-yellow-100 text-yellow-800';
    if (condition >= 4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Photo Analysis</h3>
        <Badge variant="secondary" className="text-xs">
          Powered by Gemini 2.5 Flash
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600">
        Let AI analyze your photos to automatically detect category, manufacturer, model, condition, and generate a description.
      </p>

      {/* Analysis Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleAnalyze}
          disabled={disabled || state.isAnalyzing || !photos.length}
          className="flex items-center gap-2"
          variant={state.result ? "outline" : "default"}
        >
          {state.isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing Photos...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              {state.result ? 'Re-analyze Photos' : 'Analyze Photos'}
            </>
          )}
        </Button>

        {!photos.length && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Camera className="h-4 w-4" />
            Upload photos first
          </div>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Analysis Failed</p>
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {state.result && (
        <div className="space-y-4 p-4 bg-white border rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Analysis Complete</h4>
            <Badge className={getConfidenceColor(state.result.confidence)}>
              {state.result.confidence}% confident
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category & Details */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-2 py-1">
                  {state.result.category}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Manufacturer</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-2 py-1">
                  {state.result.manufacturer}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Model</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-2 py-1">
                  {state.result.model}
                </p>
              </div>
            </div>

            {/* Condition & Description */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Condition</label>
                <div className="flex items-center gap-2">
                  <Badge className={getConditionColor(state.result.condition)}>
                    {state.result.condition}/10
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Generated Description</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-2 py-2 max-h-32 overflow-y-auto">
                  {state.result.description}
                </p>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {state.result.suggestions && state.result.suggestions.length > 0 && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">AI Suggestions</label>
                <div className="space-y-1">
                  {state.result.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600">•</span>
                      <span className="text-gray-700">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Apply Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleApplyAnalysis} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Apply Analysis to Form
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}