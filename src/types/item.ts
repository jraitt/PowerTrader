import { z } from 'zod';

/**
 * Item category enum
 */
export const ItemCategory = {
  ATV: 'ATV',
  Snowmobile: 'Snowmobile',
  Trailer: 'Trailer',
  SmallEngine: 'Small Engine',
} as const;

export type ItemCategoryType = (typeof ItemCategory)[keyof typeof ItemCategory];

/**
 * Item status enum
 */
export const ItemStatus = {
  Available: 'Available',
  Pending: 'Pending',
  Sold: 'Sold',
  Hold: 'Hold',
} as const;

export type ItemStatusType = (typeof ItemStatus)[keyof typeof ItemStatus];

/**
 * Item photo interface
 */
export interface ItemPhoto {
  id: string;
  item_id: string;
  url: string;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

/**
 * Core item interface
 */
export interface Item {
  id: string;
  category: ItemCategoryType;
  manufacturer: string;
  model: string;
  year: number | null;
  condition: number;
  asking_price: number;
  final_price: number | null;
  sold_price: number | null;
  purchase_location: string | null;
  purchase_date: string | null;
  sale_date: string | null;
  status: ItemStatusType;
  description: string;
  vin_serial: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  deleted_at: string | null;
  item_photos?: ItemPhoto[];
}

/**
 * Item form data interface
 */
export interface ItemFormData {
  category: ItemCategoryType;
  manufacturer: string;
  model: string;
  year?: number;
  condition: number;
  asking_price: number;
  final_price?: number;
  sold_price?: number;
  purchase_location?: string;
  purchase_date?: string;
  sale_date?: string;
  status: ItemStatusType;
  description: string;
  vin_serial?: string;
  photos?: File[];
}

/**
 * Zod schema for item validation
 */
export const ItemSchema = z.object({
  category: z.enum(['ATV', 'Snowmobile', 'Trailer', 'Small Engine']),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  condition: z.number().int().min(1).max(10),
  asking_price: z.number().positive('Asking price must be positive'),
  final_price: z.number().positive().optional(),
  sold_price: z.number().positive().optional(),
  purchase_location: z.string().max(255).optional(),
  purchase_date: z.string().optional(),
  sale_date: z.string().optional(),
  status: z.enum(['Available', 'Pending', 'Sold', 'Hold']).default('Available'),
  description: z.string().min(1, 'Description is required'),
  vin_serial: z.string().max(100).optional(),
});

export type ItemSchemaType = z.infer<typeof ItemSchema>;

/**
 * Item filter interface for search and filtering
 */
export interface ItemFilters {
  category?: ItemCategoryType[];
  status?: ItemStatusType[];
  manufacturer?: string[];
  minPrice?: number;
  maxPrice?: number;
  minCondition?: number;
  maxCondition?: number;
  minYear?: number;
  maxYear?: number;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Item sort options
 */
export const ItemSortOptions = {
  'created_at-desc': 'Newest First',
  'created_at-asc': 'Oldest First',
  'asking_price-desc': 'Price: High to Low',
  'asking_price-asc': 'Price: Low to High',
  'condition-desc': 'Condition: Best First',
  'condition-asc': 'Condition: Worst First',
  'manufacturer-asc': 'Manufacturer A-Z',
  'manufacturer-desc': 'Manufacturer Z-A',
} as const;

export type ItemSortType = keyof typeof ItemSortOptions;

/**
 * Activity log entry
 */
export interface ActivityLogEntry {
  id: string;
  item_id: string | null;
  user_id: string;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
}

/**
 * Dashboard stats interface
 */
export interface DashboardStats {
  totalItems: number;
  availableItems: number;
  pendingItems: number;
  soldItems: number;
  totalInventoryValue: number;
  monthlyRevenue: number;
  averageCondition: number;
  topCategory: ItemCategoryType;
}

/**
 * AI analysis result interface
 */
export interface AIAnalysisResult {
  category: ItemCategoryType;
  manufacturer: string;
  model: string;
  condition: number;
  description: string;
  confidence: number;
  suggestions: string[];
}

/**
 * URL import result interface
 */
export interface URLImportResult {
  title: string;
  description: string;
  price: number | null;
  location: string | null;
  photos: string[];
  metadata: Record<string, any>;
}