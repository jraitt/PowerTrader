'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Item, ItemCategory } from '@/types/item';
import { formatCurrency } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  ChevronRight,
  SlidersHorizontal,
  Phone,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ShopPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams?.get('category') || 'all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchItems();
  }, [searchQuery, categoryFilter, sortField, sortDirection]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        category: categoryFilter === 'all' ? '' : categoryFilter,
        sort: sortField,
        order: sortDirection,
        limit: '100'
      });

      const response = await fetch(`/api/public/items?${params}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchItems();
  };

  const isAdmin = user?.publicMetadata?.role === 'admin';

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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Our Inventory</h2>
            <p className="mt-2 text-gray-600">
              Browse our selection of quality ATVs, snowmobiles, lawn tractors, and utility trailers.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
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

                {/* Sort */}
                <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
                  const [field, direction] = value.split('-');
                  setSortField(field);
                  setSortDirection(direction as 'asc' | 'desc');
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="asking_price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="asking_price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="year-desc">Year: Newest</SelectItem>
                    <SelectItem value="year-asc">Year: Oldest</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* View Controls */}
              <div className="flex items-center space-x-4">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Display */}
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
        ) : items.length > 0 ? (
          <div className={viewMode === 'grid' ? 
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : 
            "space-y-6"
          }>
            {items.map((item) => (
              <div key={item.id} className={viewMode === 'grid' ? 
                "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow" :
                "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex"
              }>
                <div className={viewMode === 'grid' ? 
                  "aspect-video bg-gray-200 relative" : 
                  "w-48 h-32 bg-gray-200 relative flex-shrink-0"
                }>
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
                <div className="p-6 flex-1">
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
                    <div className="flex space-x-2">
                      <Link href={`/shop/${item.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                      <Link href="/contact">
                        <Button size="sm">
                          Inquire
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or check back later for new inventory.
              </p>
              <div className="mt-6">
                <Link href="/contact">
                  <Button>
                    Contact Us for Special Requests
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Interested in a Specific Item?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Contact us for more information, to schedule a viewing, or to make an offer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center justify-center space-x-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <span className="font-medium">(555) 123-4567</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="font-medium">info@primitivepowersports.com</span>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/contact">
                <Button size="lg">
                  Contact Us Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}