"use client"

import { useState } from 'react';
import { Item } from '@/types/item';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getConditionLabel } from '@/lib/utils';
import { Edit, Trash2, Eye, Calendar, MapPin, Hash } from 'lucide-react';
import Image from 'next/image';

interface ItemGridProps {
  items: Item[];
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onView?: (item: Item) => void;
  isLoading?: boolean;
}

export function ItemGrid({ items, onEdit, onDelete, onView, isLoading = false }: ItemGridProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => new Set(prev).add(itemId));
  };

  const getPrimaryImage = (item: Item): string | null => {
    if (!item.item_photos || item.item_photos.length === 0) return null;
    
    // Find primary image or use first image
    const primaryPhoto = item.item_photos.find(p => p.is_primary) || item.item_photos[0];
    return primaryPhoto?.url || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Sold':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Hold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ATV':
        return 'bg-red-50 text-red-700';
      case 'Snowmobile':
        return 'bg-blue-50 text-blue-700';
      case 'Trailer':
        return 'bg-purple-50 text-purple-700';
      case 'Small Engine':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <div className="w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
        <p className="text-gray-500">No inventory items match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => {
        const primaryImage = getPrimaryImage(item);
        const hasImageError = imageErrors.has(item.id);
        
        // Debug logging for photo issues
        if (item.item_photos && item.item_photos.length > 0) {
          console.log(`Item ${item.id} (${item.manufacturer} ${item.model}):`, {
            totalPhotos: item.item_photos.length,
            primaryImage: primaryImage,
            hasError: hasImageError,
            photos: item.item_photos.map(p => ({ url: p.url, is_primary: p.is_primary }))
          });
        } else {
          console.log(`Item ${item.id} (${item.manufacturer} ${item.model}) has no photos`);
        }

        return (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 group"
          >
            {/* Image Section */}
            <div className="relative h-48 bg-gray-100">
              {primaryImage && !hasImageError ? (
                <Image
                  src={primaryImage}
                  alt={`${item.manufacturer} ${item.model}`}
                  fill
                  className="object-cover"
                  priority={true}
                  onError={() => handleImageError(item.id)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No Image</p>
                    {/* Debug info */}
                    {item.item_photos && item.item_photos.length > 0 && (
                      <p className="text-xs mt-1">
                        {item.item_photos.length} photos available
                        {hasImageError && ' (load error)'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Photo Count Badge */}
              {item.item_photos && item.item_photos.length > 1 && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                  +{item.item_photos.length - 1} more
                </div>
              )}

              {/* Status Badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                {item.status}
              </div>

              {/* Action Buttons - Show on Hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  {onView && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white hover:bg-gray-100"
                      onClick={() => onView(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white hover:bg-gray-100"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white hover:bg-red-50 text-red-600 hover:text-red-700"
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
              {/* Category Badge */}
              <div className="mb-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                  {item.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                {item.year ? `${item.year} ` : ''}{item.manufacturer} {item.model}
              </h3>

              {/* Condition */}
              <div className="flex items-center mb-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium">Condition:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {item.condition}/10 - {getConditionLabel(item.condition)}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-3">
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(item.asking_price)}
                </div>
                {item.final_price && item.final_price !== item.asking_price && (
                  <div className="text-sm text-gray-500 line-through">
                    Originally {formatCurrency(item.final_price)}
                  </div>
                )}
                {item.sold_price && item.status === 'Sold' && (
                  <div className="text-sm font-medium text-gray-900">
                    Sold for {formatCurrency(item.sold_price)}
                  </div>
                )}
              </div>

              {/* Meta Information */}
              <div className="space-y-1 text-xs text-gray-500">
                {item.purchase_location && (
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{item.purchase_location}</span>
                  </div>
                )}
                
                {item.vin_serial && (
                  <div className="flex items-center">
                    <Hash className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate font-mono">{item.vin_serial}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>Added {formatDate(item.created_at)}</span>
                </div>
              </div>

              {/* Description Preview */}
              {item.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}