const ebayService = require('./ebayService');

class PriceService {
  async getPriceComparison(card) {
    try {
      console.log(`Price Service: Getting price comparison for card: ${card.name}`);

      // Check if eBay is configured
      if (!ebayService.isConfigured()) {
        console.warn('Price Service: eBay API not configured, returning mock data');
        return this.getMockPriceData(card);
      }

      // Fetch data from eBay
      const [recentSales, activeListings] = await Promise.all([
        ebayService.searchCompletedListings(card),
        ebayService.searchActiveListings(card)
      ]);

      console.log(`Price Service: Found ${recentSales.length} recent sales and ${activeListings.length} active listings`);

      // Calculate price statistics
      const allPrices = [...recentSales, ...activeListings].map(item => item.price);
      const statistics = this.calculatePriceStatistics(allPrices);

      const priceComparison = {
        cardId: card._id,
        averagePrice: statistics.average,
        medianPrice: statistics.median,
        priceRange: {
          min: statistics.min,
          max: statistics.max
        },
        sources: {
          ebay: {
            recentSales: recentSales.slice(0, 10), // Limit to 10 most recent
            activeListings: activeListings.slice(0, 10) // Limit to 10 most relevant
          },
          other: [] // Placeholder for future integrations
        },
        lastUpdated: new Date().toISOString(),
        totalListings: recentSales.length + activeListings.length
      };

      console.log(`Price Service: Calculated average price: $${statistics.average}`);
      return priceComparison;

    } catch (error) {
      console.error('Price Service: Error getting price comparison:', error.message);
      
      // Fallback to mock data if API fails
      console.log('Price Service: Falling back to mock data due to API error');
      return this.getMockPriceData(card);
    }
  }

  calculatePriceStatistics(prices) {
    if (prices.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0
      };
    }

    const sortedPrices = prices.sort((a, b) => a - b);
    const sum = prices.reduce((acc, price) => acc + price, 0);
    
    return {
      average: Math.round((sum / prices.length) * 100) / 100,
      median: this.calculateMedian(sortedPrices),
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  calculateMedian(sortedPrices) {
    const mid = Math.floor(sortedPrices.length / 2);
    
    if (sortedPrices.length % 2 === 0) {
      return Math.round(((sortedPrices[mid - 1] + sortedPrices[mid]) / 2) * 100) / 100;
    } else {
      return sortedPrices[mid];
    }
  }

  getMockPriceData(card) {
    // Return mock data when eBay API is not available
    const basePrice = card.estimatedValue || 50;
    
    return {
      cardId: card._id,
      averagePrice: basePrice,
      medianPrice: Math.round(basePrice * 0.9),
      priceRange: {
        min: Math.round(basePrice * 0.5),
        max: Math.round(basePrice * 1.8)
      },
      sources: {
        ebay: {
          recentSales: [
            {
              title: `${card.name} - Similar Card`,
              price: Math.round(basePrice * 0.9),
              condition: 'Near Mint',
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              url: 'https://ebay.com/mock-listing-1',
              source: 'eBay'
            },
            {
              title: `${card.player} ${card.year} Card`,
              price: Math.round(basePrice * 1.1),
              condition: 'Excellent',
              date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              url: 'https://ebay.com/mock-listing-2',
              source: 'eBay'
            }
          ],
          activeListings: [
            {
              title: `${card.name} - Active Listing`,
              price: Math.round(basePrice * 1.2),
              condition: 'Near Mint',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              url: 'https://ebay.com/mock-active-1',
              source: 'eBay'
            }
          ]
        },
        other: [
          {
            title: `${card.name} - Other Marketplace`,
            price: Math.round(basePrice * 0.95),
            condition: 'Good',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://example-marketplace.com/mock-listing',
            source: 'Other Marketplace'
          }
        ]
      },
      lastUpdated: new Date().toISOString(),
      totalListings: 3,
      note: 'Mock data - eBay API not configured'
    };
  }
}

module.exports = new PriceService();