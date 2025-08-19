"use client"

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/types/item';
import { formatCurrency } from '@/lib/utils';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  MapPin, 
  FileText,
  Star,
  Package
} from 'lucide-react';
import Link from 'next/link';
import InventoryHeader from '@/components/layouts/InventoryHeader';

export default function ItemDetailPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemId = params.id as string;

  useEffect(() => {
    if (isLoaded && user && itemId) {
      fetchItem();
    }
  }, [isLoaded, user, itemId]);

  const fetchItem = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/items/${itemId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Item not found');
        } else {
          throw new Error('Failed to fetch item');
        }
        return;
      }

      const data = await response.json();
      setItem(data);
    } catch (err) {
      console.error('Error fetching item:', err);
      setError('Failed to load item details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    
    if (!confirm(`Are you sure you want to delete "${item.manufacturer} ${item.model}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete item');
      
      // Navigate back to inventory
      router.push('/inventory');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const getConditionLabel = (condition: number): string => {
    if (condition >= 9) return 'Excellent';
    if (condition >= 7) return 'Very Good';
    if (condition >= 5) return 'Good';
    if (condition >= 3) return 'Fair';
    return 'Poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Sold':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InventoryHeader />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link href="/inventory">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inventory
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InventoryHeader />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading item details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InventoryHeader />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Not Found</h1>
            <p className="text-gray-600 mb-8">The item you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/inventory">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inventory
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InventoryHeader />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/inventory">
                <Button variant="outline" size="sm" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Inventory
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {item.manufacturer} {item.model}
              </h1>
              <p className="mt-2 text-gray-600">
                {item.year && `${item.year} `}{item.category}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link href={`/inventory/edit/${item.id}`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Package className="h-4 w-4 mr-2" />
                    Category
                  </div>
                  <p className="text-lg font-medium text-gray-900">{item.category}</p>
                </div>
                
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Star className="h-4 w-4 mr-2" />
                    Condition
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    {item.condition}/10 - {getConditionLabel(item.condition)}
                  </p>
                </div>

                {item.vin_serial && (
                  <div className="md:col-span-2">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <FileText className="h-4 w-4 mr-2" />
                      VIN/Serial Number
                    </div>
                    <p className="text-lg font-medium text-gray-900 font-mono">{item.vin_serial}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            {/* Purchase Information */}
            {(item.purchase_location || item.purchase_date) && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Purchase Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {item.purchase_location && (
                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <MapPin className="h-4 w-4 mr-2" />
                        Purchase Location
                      </div>
                      <p className="text-lg font-medium text-gray-900">{item.purchase_location}</p>
                    </div>
                  )}
                  
                  {item.purchase_date && (
                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        Purchase Date
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {new Date(item.purchase_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Photos */}
            {item.item_photos && item.item_photos.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Photos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.item_photos.map((photo, index) => (
                    <div key={photo.id} className="relative">
                      <img
                        src={photo.url}
                        alt={`${item.manufacturer} ${item.model} - Photo ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      {photo.is_primary && (
                        <Badge className="absolute top-2 left-2">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Pricing */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Status & Pricing</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-gray-500 mb-2">Status</div>
                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                </div>

                <div className="h-[1px] w-full bg-gray-200" />

                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Asking Price
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(item.asking_price)}</p>
                </div>

                {item.final_price && (
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Final Price
                    </div>
                    <p className="text-xl font-semibold text-gray-900">{formatCurrency(item.final_price)}</p>
                  </div>
                )}

                {item.sold_price && (
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Sold Price
                    </div>
                    <p className="text-xl font-semibold text-green-600">{formatCurrency(item.sold_price)}</p>
                  </div>
                )}

                {item.sale_date && (
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      Sale Date
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(item.sale_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                  </p>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(item.updated_at).toLocaleDateString()} at {new Date(item.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}