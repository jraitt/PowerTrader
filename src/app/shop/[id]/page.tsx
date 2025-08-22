'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Item } from '@/types/item';
import { formatCurrency } from '@/lib/utils';
import { 
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Gauge,
  Settings,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ItemDetailPage() {
  const params = useParams();
  const { user } = useUser();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchItem(params.id as string);
    }
  }, [params?.id]);

  const fetchItem = async (id: string) => {
    try {
      setIsLoading(true);
      // Try public endpoint first, fall back to admin endpoint if user is authenticated
      const response = await fetch(`/api/public/items/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.item) {
          setItem(data.item);
        } else {
          setError('Item not found');
        }
      } else {
        setError('Item not found');
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      setError('Failed to load item');
    } finally {
      setIsLoading(false);
    }
  };

  const nextImage = () => {
    if (item?.item_photos && currentImageIndex < item.item_photos.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const isAdmin = user?.publicMetadata?.role === 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <Image 
                  src="/primitive-logo.png" 
                  alt="Primitive Powersports" 
                  width={40} 
                  height={40}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Primitive Powersports</h1>
                </div>
              </Link>
            </div>
          </div>
        </nav>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/shop">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <Image 
                  src="/primitive-logo.png" 
                  alt="Primitive Powersports" 
                  width={40} 
                  height={40}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    Primitive Powersports
                  </h1>
                  <p className="text-xs text-gray-500">Quality. Trust. Experience.</p>
                </div>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
              <Link href="/shop" className="text-blue-600 font-medium">Shop</Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
              {isAdmin && (
                <Link href="/inventory" className="text-blue-600 font-medium">Admin</Link>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/contact">
                <Button>Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-gray-700">Shop</Link>
            <span>/</span>
            <span className="text-gray-900">{item.manufacturer} {item.model}</span>
          </div>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link href="/shop">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
        </div>

        {/* Item Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            {item.item_photos && item.item_photos.length > 0 ? (
              <>
                {/* Main Image */}
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative">
                  <Image
                    src={item.item_photos[currentImageIndex].url}
                    alt={`${item.manufacturer} ${item.model}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {item.item_photos.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        disabled={currentImageIndex === item.item_photos.length - 1}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {item.item_photos.length}
                  </div>
                </div>

                {/* Thumbnail Images */}
                {item.item_photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-4">
                    {item.item_photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 ${
                          index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                        }`}
                      >
                        <Image
                          src={photo.url}
                          alt={`${item.manufacturer} ${item.model} - Image ${index + 1}`}
                          width={100}
                          height={100}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No Images Available</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary">{item.category}</Badge>
                <Badge variant="outline">Available</Badge>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {item.year} {item.manufacturer} {item.model}
              </h1>
              <div className="mt-4">
                <span className="text-3xl font-bold text-blue-600">
                  {formatCurrency(item.asking_price)}
                </span>
              </div>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-medium">{item.year}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Condition</p>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{item.condition}/10</span>
                    <div className="flex space-x-1">
                      {[...Array(10)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < item.condition ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {item.mileage_hours && (
                <div className="flex items-center space-x-3">
                  <Gauge className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {item.category === 'ATV' || item.category === 'Snowmobile' ? 'Mileage' : 'Hours'}
                    </p>
                    <p className="font-medium">{item.mileage_hours.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {item.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{item.location}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            <Separator />

            {/* Contact Section */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Interested in this item?
              </h3>
              <p className="text-gray-600 mb-4">
                Contact us for more information, to schedule a viewing, or to make an offer.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">(555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">info@primitivepowersports.com</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact" className="flex-1">
                  <Button className="w-full" size="lg">
                    Contact Us About This Item
                  </Button>
                </Link>
                <Button variant="outline" size="lg" onClick={() => window.print()}>
                  Print Details
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {(item.engine_size || item.transmission || item.drivetrain) && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Specifications</h3>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {item.engine_size && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Engine Size</p>
                    <p className="font-medium">{item.engine_size}</p>
                  </div>
                )}
                {item.transmission && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Transmission</p>
                    <p className="font-medium">{item.transmission}</p>
                  </div>
                )}
                {item.drivetrain && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Drivetrain</p>
                    <p className="font-medium">{item.drivetrain}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}