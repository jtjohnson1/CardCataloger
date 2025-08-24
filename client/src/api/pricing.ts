import api from './api'

export interface PriceSource {
  title: string;
  price: number;
  condition: string;
  date: string;
  url?: string;
  source: string;
}

export interface EbayPricing {
  recentSales: PriceSource[];
  activeListings: PriceSource[];
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
    ebay: EbayPricing;
    other: PriceSource[];
  };
  lastUpdated: string;
  totalListings: number;
  note?: string;
}

// Description: Get price comparison data for a specific card
// Endpoint: GET /api/cards/{cardId}/price-comparison
// Request: {}
// Response: PriceComparison object with aggregated pricing data from multiple sources
export const getPriceComparison = async (cardId: string): Promise<PriceComparison> => {
  // Mocking the response for development
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock price data based on the cardId
      const mockPriceData: PriceComparison = {
        cardId: cardId,
        averagePrice: 2500,
        medianPrice: 2250,
        priceRange: {
          min: 1200,
          max: 4500
        },
        sources: {
          ebay: {
            recentSales: [
              {
                title: "1989 Upper Deck Ken Griffey Jr. #1 PSA 9",
                price: 2800,
                condition: "Near Mint",
                date: "2024-01-10T00:00:00Z",
                url: "https://ebay.com/mock-listing-1",
                source: "eBay"
              },
              {
                title: "Ken Griffey Jr. 1989 Upper Deck Rookie Card",
                price: 2200,
                condition: "Excellent",
                date: "2024-01-08T00:00:00Z",
                url: "https://ebay.com/mock-listing-2",
                source: "eBay"
              },
              {
                title: "1989 Upper Deck Baseball #1 Ken Griffey Jr RC",
                price: 2500,
                condition: "Near Mint",
                date: "2024-01-05T00:00:00Z",
                url: "https://ebay.com/mock-listing-3",
                source: "eBay"
              }
            ],
            activeListings: [
              {
                title: "1989 Upper Deck Ken Griffey Jr. Rookie Card #1",
                price: 3200,
                condition: "Mint",
                date: "2024-01-12T00:00:00Z",
                url: "https://ebay.com/mock-active-1",
                source: "eBay"
              },
              {
                title: "Ken Griffey Jr. 1989 Upper Deck #1 PSA Ready",
                price: 1800,
                condition: "Good",
                date: "2024-01-11T00:00:00Z",
                url: "https://ebay.com/mock-active-2",
                source: "eBay"
              }
            ]
          },
          other: [
            {
              title: "1989 Upper Deck Ken Griffey Jr. - COMC",
              price: 2400,
              condition: "Near Mint",
              date: "2024-01-09T00:00:00Z",
              url: "https://comc.com/mock-listing",
              source: "COMC"
            },
            {
              title: "Ken Griffey Jr. Rookie Card - Sports Card Pro",
              price: 2600,
              condition: "Excellent",
              date: "2024-01-07T00:00:00Z",
              url: "https://sportscardpro.com/mock-listing",
              source: "Sports Card Pro"
            }
          ]
        },
        lastUpdated: new Date().toISOString(),
        totalListings: 7,
        note: "Mock data - eBay API not configured"
      };

      resolve(mockPriceData);
    }, 800);
  });
};