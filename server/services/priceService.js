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

      // Build search query from card details
      const searchQuery = `${card.name} ${card.year} ${card.manufacturer}`.trim();

      // Get real eBay data
      const [recentSales, activeListings] = await Promise.all([
        this.ebayService.searchCompletedListings(searchQuery),
        this.ebayService.searchActiveListings(searchQuery)
      ]);

      // Calculate real pricing statistics
      const allPrices = [...recentSales, ...activeListings];
      const averagePrice = this.calculateAveragePrice(allPrices);
      const medianPrice = this.calculateMedianPrice(allPrices);
      const priceRange = {
        min: Math.min(...allPrices.map(p => p.price)),
        max: Math.max(...allPrices.map(p => p.price))
      };

      // Determine trend (simplified - compare recent vs older sales)
      const trend = this.calculatePriceTrend(recentSales);

      const pricing = {
        cardId: cardId,
        averagePrice,
        medianPrice,
        priceRange,
        sources: {
          ebay: {
            recentSales,
            activeListings,
            lastUpdated: new Date().toISOString()
          },
          other: {
            listings: [], // Add other marketplace integrations here
            lastUpdated: new Date().toISOString()
          }
        },
        trend,
        lastUpdated: new Date().toISOString()
      };

      console.log(`PriceService.getCardPricing - Generated real pricing for card: ${card.name}`);
      return pricing;

    } catch (error) {
      console.error('Error in PriceService.getCardPricing:', error);
      throw error;
    }
  }

  calculatePriceTrend(recentSales) {
    if (recentSales.length < 2) return 'stable';

    // Simple trend calculation - compare first half vs second half of recent sales
    const midPoint = Math.floor(recentSales.length / 2);
    const earlierSales = recentSales.slice(0, midPoint);
    const laterSales = recentSales.slice(midPoint);

    const earlierAvg = this.calculateAveragePrice(earlierSales);
    const laterAvg = this.calculateAveragePrice(laterSales);

    const percentChange = ((laterAvg - earlierAvg) / earlierAvg) * 100;

    if (percentChange > 5) return 'up';
    if (percentChange < -5) return 'down';
    return 'stable';
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