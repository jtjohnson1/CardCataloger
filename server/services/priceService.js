const EbayService = require('./ebayService');
const Card = require('../models/Card');

class PriceService {
  constructor() {
    this.ebayService = new EbayService();
    console.log('PriceService initialized');
  }

  async getCardPricing(cardId) {
    try {
      console.log(`PriceService.getCardPricing called for card: ${cardId}`);

      // Get card details
      const card = await Card.findById(cardId);
      if (!card) {
        throw new Error(`Card not found: ${cardId}`);
      }

      // Mock pricing data for now (in real implementation, this would call eBay API)
      const mockPricing = {
        cardId: cardId,
        averagePrice: Math.random() * 100 + 10, // Random price between $10-$110
        medianPrice: Math.random() * 80 + 15,   // Random price between $15-$95
        priceRange: {
          min: 5.00,
          max: 150.00
        },
        sources: {
          ebay: {
            recentSales: [
              {
                source: 'eBay',
                price: Math.random() * 50 + 20,
                condition: 'Near Mint',
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                title: `${card.name} - ${card.year}`,
                shipping: 3.99
              },
              {
                source: 'eBay',
                price: Math.random() * 40 + 15,
                condition: 'Excellent',
                date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
                title: `${card.name} Card`,
                shipping: 4.50
              }
            ],
            activeListings: [
              {
                source: 'eBay',
                price: Math.random() * 60 + 25,
                condition: 'Mint',
                date: new Date().toISOString(),
                title: `${card.name} PSA Graded`,
                shipping: 5.99
              }
            ],
            lastUpdated: new Date().toISOString()
          },
          other: {
            listings: [],
            lastUpdated: new Date().toISOString()
          }
        },
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
        lastUpdated: new Date().toISOString()
      };

      console.log(`PriceService.getCardPricing - Generated pricing for card: ${card.name}`);
      return mockPricing;

    } catch (error) {
      console.error('Error in PriceService.getCardPricing:', error);
      throw error;
    }
  }

  async refreshCardPricing(cardId) {
    try {
      console.log(`PriceService.refreshCardPricing called for card: ${cardId}`);

      // For now, just return fresh pricing data
      const pricing = await this.getCardPricing(cardId);

      console.log(`PriceService.refreshCardPricing - Refreshed pricing for card: ${cardId}`);
      return pricing;

    } catch (error) {
      console.error('Error in PriceService.refreshCardPricing:', error);
      throw error;
    }
  }

  calculateAveragePrice(prices) {
    if (!prices || prices.length === 0) return 0;
    const sum = prices.reduce((acc, price) => acc + price.price, 0);
    return sum / prices.length;
  }

  calculateMedianPrice(prices) {
    if (!prices || prices.length === 0) return 0;
    const sortedPrices = prices.map(p => p.price).sort((a, b) => a - b);
    const mid = Math.floor(sortedPrices.length / 2);
    return sortedPrices.length % 2 === 0
      ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
      : sortedPrices[mid];
  }
}

module.exports = new PriceService();