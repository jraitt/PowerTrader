"use client"

import { useState } from 'react';
import { Item } from '@/types/item';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getConditionLabel } from '@/lib/utils';
import { Edit, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface ItemTableProps {
  items: Item[];
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onView?: (item: Item) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  isLoading?: boolean;
}

export function ItemTable({ 
  items, 
  onEdit, 
  onDelete, 
  onView, 
  onSort,
  sortField,
  sortDirection,
  isLoading = false 
}: ItemTableProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => new Set(prev).add(itemId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Sold':
        return 'bg-gray-100 text-gray-800';
      case 'Hold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const getPrimaryImage = (item: Item): string | null => {
    if (!item.item_photos || item.item_photos.length === 0) return null;
    
    // Find primary image or use first image
    const primaryPhoto = item.item_photos.find(p => p.is_primary) || item.item_photos[0];
    return primaryPhoto?.url || null;
  };

  const handleSort = (field: string) => {
    if (!onSort) return;
    
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field, direction);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const SortableHeader = ({ field, children, className = "" }: { 
    field: string; 
    children: React.ReactNode; 
    className?: string;
  }) => (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {onSort ? (
        <button
          onClick={() => handleSort(field)}
          className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
        >
          <span>{children}</span>
          <SortIcon field={field} />
        </button>
      ) : (
        children
      )}
    </th>
  );

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100"></div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-t h-16 bg-gray-50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
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
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <SortableHeader field="category">Category</SortableHeader>
              <SortableHeader field="condition">Condition</SortableHeader>
              <SortableHeader field="asking_price">Price</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <SortableHeader field="purchase_location">Location</SortableHeader>
              <SortableHeader field="created_at">Added</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => {
              const primaryImage = getPrimaryImage(item);
              const hasImageError = imageErrors.has(item.id);

              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  {/* Item Column - Image + Details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 h-12 w-12 relative">
                        {primaryImage && !hasImageError ? (
                          <Image
                            src={primaryImage}
                            alt={`${item.manufacturer} ${item.model}`}
                            fill
                            className="rounded-lg object-cover"
                            onError={() => handleImageError(item.id)}
                            sizes="48px"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {/* Photo count badge */}
                        {item.item_photos && item.item_photos.length > 1 && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {item.item_photos.length}
                          </div>
                        )}
                      </div>
                      
                      {/* Item Details */}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.year ? `${item.year} ` : ''}{item.manufacturer} {item.model}
                        </div>
                        {item.vin_serial && (
                          <div className="text-sm text-gray-500 font-mono">
                            {item.vin_serial.length > 10 ? 
                              `${item.vin_serial.substring(0, 10)}...` : 
                              item.vin_serial
                            }
                          </div>
                        )}
                        {item.description && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </td>

                  {/* Condition */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="font-semibold">{item.condition}/10</span>
                      <div className="text-xs text-gray-500">{getConditionLabel(item.condition)}</div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(item.asking_price)}
                      </div>
                      {item.sold_price && item.status === 'Sold' && (
                        <div className="text-xs text-gray-500">
                          Sold: {formatCurrency(item.sold_price)}
                        </div>
                      )}
                      {item.final_price && item.final_price !== item.asking_price && (
                        <div className="text-xs text-gray-500">
                          Final: {formatCurrency(item.final_price)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.purchase_location || '-'}
                  </td>

                  {/* Added Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{formatDate(item.created_at)}</div>
                    {item.sale_date && (
                      <div className="text-xs">Sold: {formatDate(item.sale_date)}</div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {onView && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(item)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}