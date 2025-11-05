// Database types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  onboarded: boolean;
}

export interface SearchPreferences {
  location: string;
  propertyType: 'apartment' | 'house' | 'any';
  maxBudget: number;
  minRooms: number;
  wantsParking: boolean;
  refinements?: {
    districts?: string[];
    lifestyle?: string;
    dealbreaker?: string;
  };
}

export interface Search {
  id: number;
  user_id: string;
  location: string;
  property_type: 'apartment' | 'house' | 'any';
  max_budget: number;
  min_rooms: number;
  wants_parking: boolean;
  refinements?: {
    districts?: string[];
    lifestyle?: string;
    dealbreaker?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  address?: string;
  description: string;
  images: string[];
  propertyType: 'apartment' | 'house';
  hasParking: boolean;
  rating?: number;
  energyClass?: string;
  yearBuilt?: number;
  floor?: number;
  totalFloors?: number;
}

export interface FinancialAnalysis {
  monthlyPayment: number;
  downPayment: number;
  propertyTax: number;
  condoFees?: number;
  totalMonthlyCost: number;
  assumptions: {
    interestRate: number;
    loanTerm: number;
  };
}

export interface Amenity {
  name: string;
  type: 'transport' | 'school' | 'commerce' | 'health' | 'leisure';
  distance: number;
  walkTime: number;
}

export interface MarketComparison {
  averagePricePerSqm: number;
  pricePositioning: 'below' | 'average' | 'above';
  percentageDifference: number;
  marketTrend: 'rising' | 'stable' | 'falling';
  similarListingsCount: number;
}

export interface AiImageAnalysis {
  roomType: string;
  condition: 'new' | 'good' | 'needs_renovation';
  features: string[];
  naturalLight: 'excellent' | 'good' | 'moderate' | 'poor';
  style: string;
}

export interface ListingEnrichment {
  listingId: string;
  aiSummary: string;
  financialAnalysis: FinancialAnalysis;
  amenities: Amenity[];
  marketComparison: MarketComparison;
  imageAnalysis: AiImageAnalysis[];
}

// AI Types
export interface RefinementQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'chips';
  options?: string[];
}

export interface OnboardingMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}
