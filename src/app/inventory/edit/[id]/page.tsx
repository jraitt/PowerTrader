"use client"

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ItemForm } from '@/components/forms/ItemForm';
import { PhotoUpload } from '@/components/forms/PhotoUpload';
import { Item, ItemSchemaType } from '@/types/item';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import InventoryHeader from '@/components/layouts/InventoryHeader';

export default function EditItemPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemId = params['id'] as string;

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

  const handleSubmit = async (data: ItemSchemaType) => {
    if (!item) return;

    setIsSubmitting(true);
    
    try {
      console.log('Updating item with data:', data);
      console.log('Files to upload:', files);
      
      // First update the item data
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update item');
      }

      const updatedItem = await response.json();
      console.log('Item updated successfully:', updatedItem);

      // Upload photos if any were selected
      if (files.length > 0) {
        console.log('Uploading photos...');
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('itemId', item.id);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          console.error('Photo upload failed, but item was updated');
          alert(`Item updated successfully, but photo upload failed. You can add photos later.`);
        } else {
          const uploadResult = await uploadResponse.json();
          console.log('Photos uploaded successfully:', uploadResult);
          alert(`Item "${data.manufacturer} ${data.model}" and ${files.length} photo(s) updated successfully!`);
        }
      } else {
        alert(`Item "${data.manufacturer} ${data.model}" updated successfully!`);
      }
      
      // Navigate back to item detail page
      router.push(`/inventory/${item.id}`);
      
    } catch (error) {
      console.error('Error updating item:', error);
      alert(error instanceof Error ? error.message : 'Failed to update item. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            <p className="text-gray-600 mb-8">The item you're trying to edit doesn't exist or you don't have permission to edit it.</p>
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

  // Convert item to form data format
  const initialData: Partial<ItemSchemaType> = {
    category: item.category,
    manufacturer: item.manufacturer,
    model: item.model,
    year: item.year || undefined,
    condition: item.condition,
    asking_price: item.asking_price,
    final_price: item.final_price || undefined,
    sold_price: item.sold_price || undefined,
    purchase_location: item.purchase_location || '',
    purchase_date: item.purchase_date || '',
    sale_date: item.sale_date || '',
    status: item.status,
    description: item.description,
    vin_serial: item.vin_serial || '',
  };

  // Extract existing photo URLs
  const existingPhotos = item.item_photos?.map(photo => photo.url) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <InventoryHeader />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/inventory/${item.id}`}>
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Item Details
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Item: {item.manufacturer} {item.model}
          </h1>
          <p className="mt-2 text-gray-600">
            Update the details for this {item.category.toLowerCase()}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <ItemForm
              initialData={initialData}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitButtonText={isSubmitting ? 'Updating...' : 'Update Item'}
            />
          </div>

          {/* Photo Upload */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Photos</h2>
              <PhotoUpload
                onFilesChange={setFiles}
                existingPhotos={existingPhotos}
                maxFiles={20}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}