import api from './api';

export interface PriceData {
  source: string;
  price: number;
  condition: string;
  date: string;
  url?: string;
  title: string;
  shipping?: number;
}

export interface PriceComparison {
  cardId: string;
  averagePrice: number;
  medianPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  sources: {
    ebay: {
      recentSales: PriceData[];
      activeListings: PriceData[];
      lastUpdated: string;
    };
    other: {
      listings: PriceData[];
      lastUpdated: string;
    };
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

// Description: Get price comparison data for a specific card
// Endpoint: GET /api/cards/:cardId/pricing
// Request: {}
// Response: { pricing: PriceComparison }
export const getCardPricing = async (cardId: string): Promise<{ pricing: PriceComparison }> => {
  try {
    const response = await api.get(`/api/cards/${cardId}/pricing`);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Refresh price data for a specific card
// Endpoint: POST /api/cards/:cardId/pricing/refresh
// Request: {}
// Response: { success: boolean, pricing: PriceComparison }
export const refreshCardPricing = async (cardId: string) => {
  try {
    const response = await api.post(`/api/cards/${cardId}/pricing/refresh`);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};