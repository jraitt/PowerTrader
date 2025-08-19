'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link, Download, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import type { URLImportResult } from '@/types/item';

interface URLImportProps {
  onImportComplete: (importResult: URLImportResult) => void;
  disabled?: boolean;
}

interface ImportState {
  url: string;
  isImporting: boolean;
  result: URLImportResult | null;
  error: string | null;
}

export default function URLImport({ onImportComplete, disabled = false }: URLImportProps) {
  const [state, setState] = useState<ImportState>({
    url: '',
    isImporting: false,
    result: null,
    error: null,
  });

  const supportedPlatforms = [
    'Facebook Marketplace',
    'Craigslist',
    'eBay'
  ];

  const handleImport = async () => {
    if (!state.url.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a URL' }));
      return;
    }

    // Basic URL validation
    try {
      new URL(state.url);
    } catch {
      setState(prev => ({ ...prev, error: 'Please enter a valid URL' }));
      return;
    }

    setState(prev => ({ ...prev, isImporting: true, error: null, result: null }));

    try {
      // Generate a temporary itemId for image downloading
      const tempItemId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/ai/import-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: state.url,
          itemId: tempItemId  // Include itemId for image downloading
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import from URL');
      }

      const importResult = data.importResult as URLImportResult;
      setState(prev => ({ ...prev, result: importResult, isImporting: false }));

    } catch (error) {
      console.error('Error importing URL:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to import from URL',
        isImporting: false,
      }));
    }
  };

  const handleApplyImport = () => {
    if (state.result) {
      onImportComplete(state.result);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, url: e.target.value, error: null }));
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="flex items-center gap-2">
        <Link className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Import from URL</h3>
        <Badge variant="secondary" className="text-xs">
          Beta Feature
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600">
        Import listing details from marketplace URLs. Supported platforms: {supportedPlatforms.join(', ')}.
      </p>

      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Marketplace URL</label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://marketplace.facebook.com/item/..."
            value={state.url}
            onChange={handleUrlChange}
            disabled={disabled || state.isImporting}
            className="flex-1"
          />
          <Button
            onClick={handleImport}
            disabled={disabled || state.isImporting || !state.url.trim()}
            className="flex items-center gap-2"
            variant={state.result ? "outline" : "default"}
          >
            {state.isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Supported Platforms Info */}
      <div className="flex flex-wrap gap-2">
        {supportedPlatforms.map((platform) => (
          <Badge key={platform} variant="outline" className="text-xs">
            {platform}
          </Badge>
        ))}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Import Failed</p>
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        </div>
      )}

      {/* Import Results */}
      {state.result && (
        <div className="space-y-4 p-4 bg-white border rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Import Complete</h4>
            <a 
              href={state.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title & Description */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-2 py-1">
                  {state.result.title}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-2 py-2 max-h-32 overflow-y-auto">
                  {state.result.description}
                </p>
              </div>
            </div>

            {/* Price & Location */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Price</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-2 py-1">
                  {state.result.price ? `$${state.result.price.toLocaleString()}` : 'Not specified'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-2 py-1">
                  {state.result.location || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Photos */}
          {state.result.photos && state.result.photos.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Found Photos ({state.result.photos.length})
                    {state.result.metadata?.downloadedImages && (
                      <span className="ml-2 text-green-600 font-medium">
                        ({state.result.metadata.downloadedImages} downloaded)
                      </span>
                    )}
                  </label>
                  {!state.result.metadata?.downloadedImages ? (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      External images (may show placeholders if blocked)
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Images downloaded and stored
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {state.result.photos.slice(0, 8).map((photoUrl, index) => {
                    // Use proxy for Facebook images to avoid CORS issues
                    const isExternalImage = !photoUrl.includes(window.location.hostname);
                    
                    // Clean the URL first - remove any double encoding issues
                    const cleanUrl = decodeURIComponent(photoUrl).replace(/\\\//g, '/');
                    
                    const displayUrl = isExternalImage && !state.result?.metadata?.downloadedImages
                      ? `/api/proxy/image?url=${encodeURIComponent(cleanUrl)}`
                      : photoUrl;

                    return (
                      <div key={index} className="aspect-square bg-gray-100 rounded border overflow-hidden relative">
                        <img
                          src={displayUrl}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // First try the proxy if we haven't already
                            if (!target.src.includes('/api/proxy/image') && isExternalImage) {
                              target.src = `/api/proxy/image?url=${encodeURIComponent(cleanUrl)}`;
                              return;
                            }
                            // If proxy also fails or images weren't downloaded, use placeholder
                            target.src = '/api/placeholder/150/150';
                            target.title = 'Image unavailable - using placeholder';
                          }}
                        />
                        <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    );
                  })}
                  {state.result.photos.length > 8 && (
                    <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center text-sm text-gray-500">
                      +{state.result.photos.length - 8} more
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Enhanced AI Metadata */}
          {state.result.metadata?.enhancedMetadata && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">AI Enhancement</label>
                <div className="space-y-2 bg-blue-50 p-3 rounded-md">
                  {state.result.metadata.enhancedMetadata.suggestedCategory && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Suggested Category:</span>
                      <span className="text-blue-700 font-medium">{state.result.metadata.enhancedMetadata.suggestedCategory}</span>
                    </div>
                  )}
                  {state.result.metadata.enhancedMetadata.suggestedManufacturer && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Manufacturer:</span>
                      <span className="text-blue-700 font-medium">{state.result.metadata.enhancedMetadata.suggestedManufacturer}</span>
                    </div>
                  )}
                  {state.result.metadata.enhancedMetadata.suggestedModel && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Model:</span>
                      <span className="text-blue-700 font-medium">{state.result.metadata.enhancedMetadata.suggestedModel}</span>
                    </div>
                  )}
                  {state.result.metadata.enhancedMetadata.suggestedYear && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Year:</span>
                      <span className="text-blue-700 font-medium">{state.result.metadata.enhancedMetadata.suggestedYear}</span>
                    </div>
                  )}
                  {state.result.metadata.enhancedMetadata.estimatedCondition && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estimated Condition:</span>
                      <span className="text-blue-700 font-medium">{state.result.metadata.enhancedMetadata.estimatedCondition}/10</span>
                    </div>
                  )}
                  {state.result.metadata.enhancedMetadata.priceAnalysis && (
                    <div className="text-sm">
                      <span className="text-gray-600">Price Analysis:</span>
                      <p className="text-blue-700 italic mt-1">{state.result.metadata.enhancedMetadata.priceAnalysis}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Standard Metadata */}
          {state.result.metadata && Object.keys(state.result.metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Source Info</label>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Source:</span>
                    <span className="text-gray-900 capitalize">{state.result.metadata.source || 'Unknown'}</span>
                  </div>
                  {state.result.metadata.listingId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Listing ID:</span>
                      <span className="text-gray-900">{state.result.metadata.listingId}</span>
                    </div>
                  )}
                  {state.result.metadata.aiEnhanced && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">AI Enhanced:</span>
                      <span className="text-green-600 font-medium">✓ Yes</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Apply Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleApplyImport} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Apply Import to Form
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}