'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Item, ItemCategory } from '@/types/item';
import { formatCurrency } from '@/lib/utils';
import { 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  Star,
  Shield,
  Award,
  Users,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const { user } = useUser();
  const [featuredItems, setFeaturedItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedItems();
  }, []);

  const fetchFeaturedItems = async () => {
    try {
      setIsLoading(true);
      // Fetch only available items for public display
      const response = await fetch('/api/public/items?limit=6&sort=created_at&order=desc');
      if (response.ok) {
        const data = await response.json();
        setFeaturedItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching featured items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    window.location.href = `/shop?${params.toString()}`;
  };

  // Check if user is admin (we'll implement this properly with Clerk metadata later)
  const isAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image 
                src="/primitive-logo.png" 
                alt="Primitive Powersports" 
                width={48} 
                height={48}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Primitive Powersports
                </h1>
                <p className="text-xs text-gray-500">Quality. Trust. Experience.</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
              <Link href="/shop" className="text-gray-700 hover:text-blue-600">Shop</Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
              {isAdmin && (
                <Link href="/inventory" className="text-blue-600 font-medium">Admin</Link>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/contact">
                    <Button>Contact Us</Button>
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Hello, {user.firstName}</span>
                  {isAdmin && (
                    <Link href="/inventory">
                      <Button size="sm">Dashboard</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  <span className="block">Quality Powersports</span>
                  <span className="block text-blue-600">Made Simple</span>
                </h1>
                <p className="text-xl text-gray-600 sm:text-2xl">
                  Your trusted source for ATVs, snowmobiles, lawn tractors, and utility trailers. 
                  Every machine carefully inspected and ready to work.
                </p>
              </div>

              {/* Search Bar */}
              <div className="bg-white rounded-lg shadow-lg p-6 border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Your Perfect Machine</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search ATVs, snowmobiles, tractors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-40 h-12">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.values(ItemCategory).map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch} size="lg" className="h-12 px-8">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto mb-2">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Inspected</p>
                  <p className="text-xs text-gray-500">Quality Guaranteed</p>
                </div>
                <div className="text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mx-auto mb-2">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Trusted</p>
                  <p className="text-xs text-gray-500">Local Experts</p>
                </div>
                <div className="text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mx-auto mb-2">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Experience</p>
                  <p className="text-xs text-gray-500">Years of Service</p>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-2xl p-8">
                <div className="relative flex h-full w-full items-center justify-center">
                  <Image 
                    src="/primitive-logo.png" 
                    alt="Primitive Powersports" 
                    fill
                    sizes="(max-width: 768px) 80vw, 40vw"
                    className="object-contain p-4"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Inventory */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Featured Inventory
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Check out our latest arrivals and popular items
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 relative">
                    {item.item_photos && item.item_photos.length > 0 ? (
                      <Image
                        src={item.item_photos[0].url}
                        alt={`${item.manufacturer} ${item.model}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary">{item.category}</Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.year} {item.manufacturer} {item.model}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(item.asking_price)}
                      </span>
                      <Link href={`/shop/${item.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">No inventory available at the moment.</p>
              <p className="text-sm text-gray-500 mt-2">Check back soon for new arrivals!</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/shop">
              <Button size="lg">
                View All Inventory
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Ready to Find Your Perfect Machine?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Contact us today for personalized recommendations and expert advice.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-300" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-300" />
                  <span>info@primitivepowersports.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-300" />
                  <span>Serving the Eastern United States</span>
                </div>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <Link href="/contact">
                <Button size="lg" variant="secondary">
                  Contact Us Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image 
                  src="/primitive-logo.png" 
                  alt="Primitive Powersports" 
                  width={40} 
                  height={40}
                  className="rounded-lg"
                />
                <div>
                  <h3 className="text-lg font-bold">Primitive Powersports</h3>
                  <p className="text-sm text-gray-400">Quality. Trust. Experience.</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Your trusted source for quality ATVs, snowmobiles, lawn tractors, and utility trailers. 
                We pride ourselves on providing carefully inspected equipment backed by expert knowledge.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/shop" className="hover:text-white">Shop Inventory</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/shop?category=ATV" className="hover:text-white">ATVs</Link></li>
                <li><Link href="/shop?category=Snowmobile" className="hover:text-white">Snowmobiles</Link></li>
                <li><Link href="/shop?category=Lawn%20Tractor" className="hover:text-white">Lawn Tractors</Link></li>
                <li><Link href="/shop?category=Utility%20Trailer" className="hover:text-white">Utility Trailers</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Primitive Powersports. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}