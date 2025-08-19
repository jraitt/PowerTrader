"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ItemSchema, ItemSchemaType, ItemCategory, ItemStatus } from '@/types/item';
import type { AIAnalysisResult, URLImportResult } from '@/types/item';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PhotoUpload } from '@/components/forms/PhotoUpload';
import AIAnalysis from '@/components/forms/AIAnalysis';
import URLImport from '@/components/forms/URLImport';
import AIAssist from '@/components/forms/AIAssist';
import { formatCurrency } from '@/lib/utils';
import { Sparkles, Camera, Link2, Wand2 } from 'lucide-react';

// Pre-define arrays to avoid creating new arrays during render
const CATEGORY_OPTIONS = Object.values(ItemCategory);
const STATUS_OPTIONS = Object.values(ItemStatus);

interface EnhancedItemFormProps {
  initialData?: Partial<ItemSchemaType>;
  onSubmit: (data: ItemSchemaType, photos: File[]) => void | Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
  showAIFeatures?: boolean;
}

export function EnhancedItemForm({ 
  initialData, 
  onSubmit, 
  isLoading = false,
  submitButtonText = "Save Item",
  showAIFeatures = true
}: EnhancedItemFormProps) {
  const [conditionValue, setConditionValue] = useState<number[]>([initialData?.condition || 5]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [activeAITab, setActiveAITab] = useState<'analysis' | 'import' | 'assist'>('analysis');

  const form = useForm<ItemSchemaType>({
    resolver: zodResolver(ItemSchema),
    defaultValues: {
      category: initialData?.category || 'ATV',
      manufacturer: initialData?.manufacturer || '',
      model: initialData?.model || '',
      year: initialData?.year,
      condition: initialData?.condition || 5,
      asking_price: initialData?.asking_price || 0,
      final_price: initialData?.final_price,
      sold_price: initialData?.sold_price,
      purchase_location: initialData?.purchase_location || '',
      purchase_date: initialData?.purchase_date || '',
      sale_date: initialData?.sale_date || '',
      status: initialData?.status || 'Available',
      description: initialData?.description || '',
      vin_serial: initialData?.vin_serial || '',
    },
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 1900 + 2 }, 
    (_, i) => currentYear + 1 - i
  );

  const handleSubmit = async (data: ItemSchemaType) => {
    try {
      await onSubmit(data, photos);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const getConditionLabel = (value: number): string => {
    if (value >= 9) return 'Excellent';
    if (value >= 7) return 'Very Good';
    if (value >= 5) return 'Good';
    if (value >= 3) return 'Fair';
    return 'Poor';
  };

  // AI Analysis handlers
  const handleAnalysisComplete = (analysis: AIAnalysisResult) => {
    form.setValue('category', analysis.category);
    form.setValue('manufacturer', analysis.manufacturer);
    form.setValue('model', analysis.model);
    form.setValue('condition', analysis.condition);
    form.setValue('description', analysis.description);
    setConditionValue([analysis.condition]);
  };

  // URL Import handlers
  const handleImportComplete = (importResult: URLImportResult) => {
    // Check for AI-enhanced metadata first
    const enhanced = importResult.metadata?.enhancedMetadata;
    
    if (enhanced) {
      // Use AI-enhanced suggestions
      if (enhanced.suggestedCategory && enhanced.suggestedCategory !== 'Unknown') {
        const validCategories = ['ATV', 'Snowmobile', 'Trailer', 'Small Engine'];
        if (validCategories.includes(enhanced.suggestedCategory)) {
          form.setValue('category', enhanced.suggestedCategory as any);
        }
      }
      
      if (enhanced.suggestedManufacturer && enhanced.suggestedManufacturer !== 'Unknown') {
        form.setValue('manufacturer', enhanced.suggestedManufacturer);
      }
      
      if (enhanced.suggestedModel && enhanced.suggestedModel !== 'Unknown') {
        form.setValue('model', enhanced.suggestedModel);
      }
      
      if (enhanced.estimatedCondition && enhanced.estimatedCondition >= 1 && enhanced.estimatedCondition <= 10) {
        form.setValue('condition', enhanced.estimatedCondition);
        setConditionValue([enhanced.estimatedCondition]);
      }
      
      if (enhanced.suggestedYear && enhanced.suggestedYear >= 1900 && enhanced.suggestedYear <= new Date().getFullYear() + 1) {
        form.setValue('year', enhanced.suggestedYear);
      }
    } else if (importResult.title) {
      // Fallback: Try to extract manufacturer and model from title
      const titleParts = importResult.title.split(' ');
      if (titleParts.length >= 2) {
        form.setValue('manufacturer', titleParts[0]);
        form.setValue('model', titleParts.slice(1).join(' '));
      }
    }
    
    // Always apply description and other basic data
    if (importResult.description) {
      form.setValue('description', importResult.description);
    }
    if (importResult.price) {
      form.setValue('asking_price', importResult.price);
    }
    if (importResult.location) {
      form.setValue('purchase_location', importResult.location);
    }
    
    // Handle photos from URL import
    if (importResult.photos && importResult.photos.length > 0) {
      console.log(`Applying ${importResult.photos.length} imported photos to form`);
      
      // Convert photo URLs to File-like objects for the PhotoUpload component
      const importedPhotoFiles = importResult.photos.map((url, index) => {
        // Create a pseudo-File object with the URL
        const pseudoFile = {
          name: `imported_image_${index + 1}.jpg`,
          size: 0,
          type: 'image/jpeg',
          lastModified: Date.now(),
          url: url, // Add the URL for later use
        } as File & { url: string };
        
        return pseudoFile;
      });
      
      // Set the imported photos 
      setPhotos(importedPhotoFiles);
    }
  };

  // AI Assist handlers
  const handleDescriptionGenerated = (description: string) => {
    form.setValue('description', description);
  };

  const handlePricingSuggested = (suggestions: {
    suggestedPrice: number;
    priceRange: { min: number; max: number };
    marketInsights: string[];
  }) => {
    form.setValue('asking_price', suggestions.suggestedPrice);
  };

  const currentFormValues = form.watch();

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          
          {/* AI Features Section */}
          {showAIFeatures && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">AI-Powered Features</h3>
                  <Badge variant="secondary" className="text-xs">NEW</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Use AI to analyze photos, import from marketplace URLs, and get smart suggestions.
                </p>
              </div>

              {/* AI Feature Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  type="button"
                  variant={activeAITab === 'analysis' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveAITab('analysis')}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Photo Analysis
                </Button>
                <Button
                  type="button"
                  variant={activeAITab === 'import' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveAITab('import')}
                  className="flex items-center gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  URL Import
                </Button>
                <Button
                  type="button"
                  variant={activeAITab === 'assist' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveAITab('assist')}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Smart Assist
                </Button>
              </div>

              {/* AI Feature Content */}
              {activeAITab === 'analysis' && (
                <AIAnalysis
                  photos={photos}
                  onAnalysisComplete={handleAnalysisComplete}
                  disabled={isLoading}
                />
              )}

              {activeAITab === 'import' && (
                <URLImport
                  onImportComplete={handleImportComplete}
                  disabled={isLoading}
                />
              )}

              {activeAITab === 'assist' && (
                <AIAssist
                  category={currentFormValues.category}
                  manufacturer={currentFormValues.manufacturer}
                  model={currentFormValues.model}
                  condition={currentFormValues.condition}
                  year={currentFormValues.year}
                  additionalDetails=""
                  onDescriptionGenerated={handleDescriptionGenerated}
                  onPricingSuggested={handlePricingSuggested}
                  disabled={isLoading}
                />
              )}
            </div>
          )}

          {/* Photos Section */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
              <p className="text-sm text-gray-600">Upload photos of your item for better visibility.</p>
            </div>

            <PhotoUpload
              onFilesChange={setPhotos}
              maxFiles={20}
              maxFileSize={10 * 1024 * 1024}
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            />
          </div>

          <Separator />

          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              <p className="text-sm text-gray-600">Enter the core details about this item.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Manufacturer */}
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Honda, Yamaha, Polaris" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Model */}
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TRX450R, FZ09, RZR 1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Year */}
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* VIN/Serial */}
              <FormField
                control={form.control}
                name="vin_serial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VIN/Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Vehicle identification or serial number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional but helpful for tracking and documentation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Condition Section */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Condition & Pricing</h3>
              <p className="text-sm text-gray-600">Rate the condition and set pricing information.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Condition Slider */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Condition: {conditionValue[0]} - {getConditionLabel(conditionValue[0])}
                      </FormLabel>
                      <FormControl>
                        <div className="px-3">
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={conditionValue}
                            onValueChange={(value) => {
                              setConditionValue(value);
                              field.onChange(value[0]);
                            }}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1 - Poor</span>
                            <span>3 - Fair</span>
                            <span>5 - Good</span>
                            <span>7 - Very Good</span>
                            <span>10 - Excellent</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Rate from 1 (poor/parts only) to 10 (excellent/like new)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Asking Price */}
              <FormField
                control={form.control}
                name="asking_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asking Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Initial listing price
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Final Price */}
              <FormField
                control={form.control}
                name="final_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Negotiated price (if different from asking)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sold Price */}
              <FormField
                control={form.control}
                name="sold_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sold Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Actual transaction amount
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Purchase Location */}
              <FormField
                control={form.control}
                name="purchase_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Where was this item acquired?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Dates Section */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Important Dates</h3>
              <p className="text-sm text-gray-600">Track purchase and sale dates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Purchase Date */}
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sale Date */}
              <FormField
                control={form.control}
                name="sale_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Auto-populated when status changes to Sold
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              <p className="text-sm text-gray-600">Provide detailed information about this item.</p>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the item's features, condition details, modifications, history, etc."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include details about features, modifications, known issues, and selling points
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Reset Form
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : submitButtonText}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}