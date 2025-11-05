// Melo.io API Service
// Documentation: https://docs.melo.io

const MELO_API_URL = 'https://api.notif.immo';
const API_KEY = import.meta.env.VITE_MELO_API_KEY;

if (!API_KEY) {
  console.warn('VITE_MELO_API_KEY is not defined. Melo.io features will not work.');
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
 * Search for a location (city, department, region)
 */
export async function searchLocation(
  query: string,
  type: 'city' | 'department' | 'region' = 'city'
): Promise<MeloLocation[]> {
  try {
    const url = new URL(`${MELO_API_URL}/indicators/locations`);
    url.searchParams.set('search', query);
    url.searchParams.set('type', type);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Melo API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Error searching location:', error);
    throw error;
  }
}

/**
 * Create a new search in Melo
 */
export async function createSearch(criteria: MeloSearchCriteria): Promise<MeloSearchResponse> {
  try {
    const response = await fetch(`${MELO_API_URL}/searches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY!,
      },
      body: JSON.stringify(criteria),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Melo API error: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating search:', error);
    throw error;
  }
}

/**
 * Get properties based on search criteria
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
    const url = new URL(`${MELO_API_URL}/documents/properties`);

    // Add search params
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        // Handle array parameters
        value.forEach((item) => {
          url.searchParams.append(`${key}[]`, item.toString());
        });
      } else if (typeof value === 'object') {
        // Handle object parameters (like expressions)
        url.searchParams.set(key, JSON.stringify(value));
      } else {
        url.searchParams.set(key, value.toString());
      }
    });

    // Default params
    if (!params.page) url.searchParams.set('page', '1');
    if (!params.itemsPerPage) url.searchParams.set('itemsPerPage', '10');
    if (!params.hasOwnProperty('expired')) url.searchParams.set('expired', 'false');
    if (!params.hasOwnProperty('withCoherentPrice')) url.searchParams.set('withCoherentPrice', 'true');

    // Sort by most recent
    url.searchParams.set('order[createdAt]', 'desc');

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Melo API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting properties:', error);
    throw error;
  }
}

/**
 * Update an existing search
 */
export async function updateSearch(
  searchId: string,
  criteria: Partial<MeloSearchCriteria>
): Promise<MeloSearchResponse> {
  try {
    const response = await fetch(`${MELO_API_URL}/searches/${searchId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY!,
      },
      body: JSON.stringify(criteria),
    });

    if (!response.ok) {
      throw new Error(`Melo API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating search:', error);
    throw error;
  }
}

/**
 * Delete a search
 */
export async function deleteSearch(searchId: string): Promise<void> {
  try {
    const response = await fetch(`${MELO_API_URL}/searches/${searchId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Melo API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting search:', error);
    throw error;
  }
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
