export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  did: string;
  isVerified: boolean;
  phoneVerified: boolean;
  phoneNumber?: string;
  ageProofGenerated?: boolean;
  didMetadata?: {
    method: string;
    controller: string;
    createdAt: number;
    version: string;
  };
  safetyScore: number;
  role: 'tourist' | 'admin';
  createdAt: any;
  travelDocuments?: {
    type: 'Passport' | 'Aadhaar';
    status: 'pending' | 'verified' | 'rejected';
    failureReason?: string;
    updatedAt: number;
  }[];
}

export interface Incident {
  id: string;
  reporterUid: string;
  type: 'theft' | 'lost_item' | 'medical' | 'unsafe_zone' | 'harassment' | 'natural_hazard' | 'suspicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  description: string;
  imageUrl?: string;
  status: 'reported' | 'investigating' | 'resolved';
  blockchainHash: string;
  createdAt: any;
}

export interface SafetyZone {
  id: string;
  name: string;
  type: 'safe' | 'caution' | 'restricted';
  geometry: {
    center: {
      lat: number;
      lng: number;
    };
    radius: number;
  };
  description: string;
  riskLevel: number;
}

export interface Hotel {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  safetyRating: number;
  rating?: number;
  amenities: string[];
  description: string;
  imageUrl?: string;
  distance?: string;
  navigationTip?: string;
  whyRecommended?: string;
  accessibilityToEmergency?: string;
  suitability?: ('solo' | 'family' | 'group')[];
}

export interface Attraction {
  id: string;
  name: string;
  category: 'adventure' | 'spiritual' | 'historical' | 'entertainment' | 'shopping' | 'nature' | 'culture' | 'landmark';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  safetyScore: number;
  description: string;
  imageUrl?: string;
  bestTimeToVisit?: string;
  whyVisit?: string;
  travelTip?: string;
  popularityScore?: number;
  crowdDensity?: 'low' | 'medium' | 'high';
}

export interface EmergencyService {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'embassy';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  description: string;
  contact: string;
}

export interface WeatherInfo {
  condition: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  safetyAlert?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
