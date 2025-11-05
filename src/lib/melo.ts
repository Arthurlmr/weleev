// Melo.io API Service via Supabase Edge Functions
// Documentation: https://docs.melo.io
// Edge Functions are used to avoid CORS issues with Melo.io API

import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  console.warn('VITE_SUPABASE_URL is not defined. Melo.io features will not work.');
}

// =====================================================
// TYPES
// =====================================================

export interface MeloLocation {
  id: string; // "/cities/75056"
  name: string;
  zipcode?: string;
  inseeCode?: string;
  type: 'city' | 'department' | 'region';
  department?: {
    id: string;
    name: string;
  };
}

export interface MeloSearchCriteria {
  title: string;
  transactionType: 0 | 1; // 0=Sale, 1=Rental
  propertyTypes: number[]; // 0=Apartment, 1=House, 2=Building, etc.
  budgetMax: number;
  roomMin?: number;
  includedCities?: string[]; // ["/cities/75056"]
  surfaceMin?: number;
  furnished?: boolean;
  expressions?: Array<{
    include?: string[];
    exclude?: string[];
  }>;
  [key: string]: any;
}

export interface MeloSearchResponse {
  '@id': string;
  uuid: string;
  token: string;
  title: string;
  createdAt: string;
  [key: string]: any;
}

export interface MeloPropertyDocument {
  '@id': string;
  uuid: string;
  title: string;
  description: string;
  price: number;
  pricePerMeter?: number;
  surface?: number;
  landSurface?: number;
  bedroom?: number;
  room?: number;
  floor?: number;
  floorQuantity?: number;
  furnished?: boolean;
  elevator?: boolean;
  energy?: {
    category: string;
    value: number;
  };
  city: {
    name: string;
    zipcode: string;
    inseeCode: string;
    latitude: number;
    longitude: number;
  };
  pictures?: string[];
  picturesRemote?: string[];
  virtualTour?: string;
  adverts: Array<{
    uuid: string;
    url: string;
    site: string;
    features?: string[];
  }>;
  createdAt: string;
  updatedAt?: string;
  expired: boolean;
  [key: string]: any;
}

export interface MeloPropertiesResponse {
  'hydra:member': MeloPropertyDocument[];
  'hydra:totalItems': number;
  'hydra:view'?: {
    'hydra:first'?: string;
    'hydra:last'?: string;
    'hydra:next'?: string;
  };
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Search for a location (city, department, region) via Edge Function
 */
export async function searchLocation(
  query: string,
  type: 'city' | 'department' | 'region' = 'city'
): Promise<MeloLocation[]> {
  try {
    const { data, error } = await supabase.functions.invoke('search-location', {
      body: { search: query, type },
    });

    if (error) throw error;

    return data.locations || [];
  } catch (error) {
    console.error('Error searching location:', error);
    throw error;
  }
}

/**
 * Create a new search in Melo via Edge Function
 */
export async function createSearch(criteria: MeloSearchCriteria): Promise<MeloSearchResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('create-melo-search', {
      body: criteria,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating search:', error);
    throw error;
  }
}

/**
 * Get properties based on search criteria via Edge Function
 */
export async function getProperties(params: {
  includedCities?: string[];
  transactionType: 0 | 1;
  propertyTypes: number[];
  budgetMax?: number;
  roomMin?: number;
  surfaceMin?: number;
  expressions?: Array<{ include?: string[]; exclude?: string[] }>;
  page?: number;
  itemsPerPage?: number;
  [key: string]: any;
}): Promise<MeloPropertiesResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('get-properties', {
      body: params,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error getting properties:', error);
    throw error;
  }
}

/**
 * Update an existing search
 * TODO: Implement Edge Function for this when needed
 */
export async function updateSearch(
  _searchId: string,
  _criteria: Partial<MeloSearchCriteria>
): Promise<MeloSearchResponse> {
  throw new Error('updateSearch not implemented yet - needs Edge Function');
}

/**
 * Delete a search
 * TODO: Implement Edge Function for this when needed
 */
export async function deleteSearch(_searchId: string): Promise<void> {
  throw new Error('deleteSearch not implemented yet - needs Edge Function');
}

// =====================================================
// MAPPING FUNCTIONS
// =====================================================

/**
 * Map property type from Weleev to Melo
 */
export function mapPropertyTypeToMelo(type: 'apartment' | 'house' | 'any'): number[] {
  switch (type) {
    case 'apartment':
      return [0];
    case 'house':
      return [1];
    case 'any':
      return [0, 1];
    default:
      return [0, 1];
  }
}

/**
 * Map property type from Melo to Weleev
 */
export function mapPropertyTypeFromMelo(meloTypes: number[]): 'apartment' | 'house' {
  if (meloTypes.includes(1)) return 'house';
  return 'apartment';
}

/**
 * Map Melo PropertyDocument to Weleev Listing format
 */
export function mapMeloToListing(melo: MeloPropertyDocument): any {
  const propertyType = melo.adverts?.[0]?.features?.includes('house') ? 'house' : 'apartment';
  const hasParking = melo.adverts?.[0]?.features?.some(f =>
    f.toLowerCase().includes('parking') || f.toLowerCase().includes('garage')
  ) || false;

  return {
    id: melo.uuid,
    title: melo.title,
    price: melo.price,
    surface: melo.surface || 0,
    rooms: melo.room || 1,
    bedrooms: melo.bedroom || 1,
    bathrooms: 1, // Estimate if not provided
    city: melo.city?.name || '',
    address: melo.city ? `${melo.city.zipcode} ${melo.city.name}` : '',
    description: melo.description || '',
    images: melo.pictures || melo.picturesRemote || [],
    propertyType,
    hasParking,
    rating: undefined, // Will be calculated by enrichment
    energyClass: melo.energy?.category,
    yearBuilt: undefined,
    floor: melo.floor,
    totalFloors: melo.floorQuantity,
  };
}
