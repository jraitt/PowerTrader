"use client"

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import InventoryHeader from '@/components/layouts/InventoryHeader';
import { ItemGrid } from '@/components/features/ItemGrid';
import { ItemTable } from '@/components/features/ItemTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Item, ItemCategory, ItemStatus } from '@/types/item';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download,
  Upload,
  MoreVertical,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import Link from 'next/link';

// Pre-define arrays to avoid creating new arrays during render
const CATEGORY_OPTIONS = Object.values(ItemCategory);
const STATUS_OPTIONS = Object.values(ItemStatus);

export default function InventoryPage() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    pendingItems: 0,
    soldThisMonth: 0
  });

  // useEffect hook must be called before any early returns
  useEffect(() => {
    // Only fetch items if user is loaded and authenticated
    if (isLoaded && user) {
      // First sync user to database, then fetch items
      syncUserToDatabase().then(() => {
        fetchItems();
      });
    }
  }, [isLoaded, user, searchQuery, categoryFilter, statusFilter, sortField, sortDirection]);

  // Sync user to database
  const syncUserToDatabase = async () => {
    try {
      const response = await fetch('/api/auth/sync-user', {
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

      if (!response.ok) {
        console.error('Failed to sync user to database');
      } else {
        const data = await response.json();
        console.log('User sync result:', data.message);
      }
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  };

  // Fetch items
  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        category: categoryFilter === 'all' ? '' : categoryFilter,
        status: statusFilter === 'all' ? '' : statusFilter,
        sort: sortField,
        order: sortDirection,
        limit: '100'
      });

      const response = await fetch(`/api/items?${params}`);
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const data = await response.json();
      console.log('Fetched items data:', data.items?.length, 'items');
      
      // Debug: Check if items have photos
      data.items?.forEach((item: Item) => {
        if (item.item_photos && item.item_photos.length > 0) {
          console.log(`Item ${item.id} (${item.manufacturer} ${item.model}) has ${item.item_photos.length} photos:`, item.item_photos);
        } else {
          console.log(`Item ${item.id} (${item.manufacturer} ${item.model}) has no photos`);
        }
      });
      
      setItems(data.items || []);

      // Calculate stats
      const totalItems = data.items?.length || 0;
      const totalValue = data.items?.reduce((sum: number, item: Item) => sum + item.asking_price, 0) || 0;
      const pendingItems = data.items?.filter((item: Item) => item.status === 'Pending').length || 0;
      
      // Calculate sold this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const soldThisMonth = data.items?.filter((item: Item) => 
        item.status === 'Sold' && 
        item.sale_date && 
        new Date(item.sale_date) >= thisMonth
      ).length || 0;

      setStats({
        totalItems,
        totalValue,
        pendingItems,
        soldThisMonth
      });

    } catch (error) {
      console.error('Error fetching items:', error);
      // If it's an authentication error, don't show error to user since they'll be redirected
      if (error instanceof Error && !error.message.includes('fetch')) {
        // Handle non-fetch errors differently
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleEdit = (item: Item) => {
    // Navigate to edit page
    window.location.href = `/inventory/edit/${item.id}`;
  };

  const handleView = (item: Item) => {
    // Navigate to detail page
    window.location.href = `/inventory/${item.id}`;
  };

  const handleDelete = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete "${item.manufacturer} ${item.model}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete item');
      
      // Refresh items list
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Redirect unauthenticated users
  if (isLoaded && !user) {
    redirect('/sign-in');
  }

  // Don't render anything while auth is loading or user is not authenticated
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            {!isLoaded ? 'Initializing...' : 'Redirecting to sign in...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <InventoryHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Inventory Management</h2>
              <p className="mt-2 text-gray-600">
                Manage your small engine machinery inventory with AI-powered tools.
              </p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={() => fetchItems()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/inventory/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-md bg-blue-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalItems}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-md bg-green-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalValue)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-md bg-yellow-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pendingItems}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-md bg-purple-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sold This Month</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.soldThisMonth}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
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
                    {CATEGORY_OPTIONS.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Actions */}
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Items Display */}
        {viewMode === 'grid' ? (
          <ItemGrid
            items={items}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            isLoading={isLoading}
          />
        ) : (
          <ItemTable
            items={items}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            isLoading={isLoading}
          />
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && !searchQuery && categoryFilter === 'all' && statusFilter === 'all' && (
          <div className="bg-white shadow rounded-lg">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first item to the inventory.
              </p>
              <div className="mt-6">
                <Link href="/inventory/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}