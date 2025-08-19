"use client"

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { EnhancedItemForm } from '@/components/forms/EnhancedItemForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ItemSchemaType } from '@/types/item';

export default function AddItemPage() {
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Redirect unauthenticated users
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Don't render anything while auth is loading
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading add item form...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: ItemSchemaType, photos: File[]) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log('Creating item with data:', data);
      console.log('Photos to upload:', photos);
      
      // Ensure user is synced to database first
      const syncResponse = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.emailAddresses?.[0]?.emailAddress,
          firstName: user?.firstName,
          lastName: user?.lastName,
          username: user?.username,
          imageUrl: user?.imageUrl,
        }),
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync user to database');
      }

      console.log('User sync completed, creating item...');
      
      // Create the item
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create item');
      }

      const newItem = await response.json();
      console.log('Item created successfully:', newItem);

      // Handle photo uploads
      if (photos.length > 0) {
        console.log(`Uploading ${photos.length} photos for item ${newItem.id}`);
        
        // Handle URL-imported photos differently
        const regularPhotos: File[] = [];
        const urlPhotos: (File & { url: string })[] = [];
        
        photos.forEach(photo => {
          if ((photo as any).url) {
            urlPhotos.push(photo as File & { url: string });
          } else {
            regularPhotos.push(photo);
          }
        });
        
        // Upload regular photos first
        if (regularPhotos.length > 0) {
          try {
            const photoFormData = new FormData();
            regularPhotos.forEach(photo => {
              photoFormData.append('files', photo);
            });
            photoFormData.append('itemId', newItem.id);

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: photoFormData,
            });

            if (!uploadResponse.ok) {
              console.error('Failed to upload regular photos');
            }
          } catch (photoError) {
            console.error('Error uploading regular photos:', photoError);
          }
        }
        
        // Handle URL-imported photos by downloading them first
        if (urlPhotos.length > 0) {
          console.log(`Processing ${urlPhotos.length} imported photos`);
          try {
            const downloadResponse = await fetch('/api/ai/download-images', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                itemId: newItem.id,
                imageUrls: urlPhotos.map(p => p.url)
              })
            });
            
            if (!downloadResponse.ok) {
              const errorData = await downloadResponse.json();
              console.error('Failed to download imported images:', errorData);
              throw new Error(`Failed to download images: ${errorData.error || 'Unknown error'}`);
            } else {
              const downloadResults = await downloadResponse.json();
              console.log('Successfully processed imported photos:', downloadResults);
              console.log(`Downloaded ${downloadResults.downloadedImages} of ${downloadResults.totalRequested} images`);
            }
          } catch (error) {
            console.error('Error processing imported photos:', error);
            // Don't fail the entire process if photo download fails
            alert(`Item created successfully, but some photos failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Show success message and redirect with a small delay to ensure photos are processed
      alert(`Item "${data.manufacturer} ${data.model}" created successfully with ${photos.length} photos!`);
      
      // Small delay to allow photo processing to complete
      if (photos.length > 0) {
        setTimeout(() => {
          router.push('/inventory');
        }, 1000); // 1 second delay
      } else {
        router.push('/inventory');
      }
      
    } catch (error) {
      console.error('Error creating item:', error);
      alert(`Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Inventory</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Item</h1>
                <p className="text-sm text-gray-600">Create a new inventory item with photos and details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedItemForm 
          onSubmit={handleSubmit}
          submitButtonText="Create Item"
          isLoading={isSubmitting}
          showAIFeatures={true}
        />
      </div>
    </div>
  );
}