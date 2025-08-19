"use client"

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ItemForm } from '@/components/forms/ItemForm';
import { PhotoUpload } from '@/components/forms/PhotoUpload';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ItemSchemaType } from '@/types/item';

export default function AddItemPage() {
  const { user, isLoaded } = useUser();
  const [files, setFiles] = useState<File[]>([]);
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

  const handleSubmit = async (data: ItemSchemaType) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log('Creating item with data:', data);
      console.log('Files to upload:', files);
      
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

      // TODO: Handle file uploads for photos
      if (files.length > 0) {
        console.log(`${files.length} files ready for upload to item ${newItem.id}`);
        // Photo upload will be implemented next
      }

      // Show success message and redirect
      alert(`Item "${data.manufacturer} ${data.model}" created successfully!`);
      router.push('/inventory');
      
    } catch (error) {
      console.error('Error creating item:', error);
      alert(`Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Item Form */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h2>
              <ItemForm 
                onSubmit={handleSubmit}
                submitButtonText="Create Item"
                isLoading={isSubmitting}
              />
            </div>
          </div>

          {/* Right Column - Photo Upload */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos</h2>
              <PhotoUpload
                onFilesChange={handleFilesChange}
                maxFiles={20}
              />
            </div>

            {/* AI Features Card */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">AI-Powered Features</h3>
              <p className="text-blue-700 mb-4">
                PowerTrader can help you create listings faster with AI assistance.
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Photo Analysis</h4>
                    <p className="text-sm text-blue-700">Upload photos and let AI identify the make, model, and condition</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">URL Import</h4>
                    <p className="text-sm text-blue-700">Import listings from Facebook Marketplace or Craigslist</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Smart Descriptions</h4>
                    <p className="text-sm text-blue-700">Generate compelling item descriptions automatically</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  Analyze Photos
                </Button>
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  Import from URL
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}