const axios = require('axios');

class EbayService {
  constructor() {
    this.appId = process.env.EBAY_APP_ID;
    this.certId = process.env.EBAY_CERT_ID;
    this.devId = process.env.EBAY_DEV_ID;
    this.userToken = process.env.EBAY_USER_TOKEN;
    this.sandbox = process.env.EBAY_SANDBOX === 'true';
    
    // eBay Finding API endpoint
    this.baseUrl = this.sandbox 
      ? 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1'
      : 'https://svcs.ebay.com/services/search/FindingService/v1';
  }

  async searchCompletedListings(card) {
    try {
      console.log(`eBay Service: Searching completed listings for card: ${card.name}`);
      
      // Build search query from card details
      const searchQuery = this.buildSearchQuery(card);
      console.log(`eBay Service: Search query: ${searchQuery}`);

      const params = {
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': this.appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        'keywords': searchQuery,
        'categoryId': '213', // Sports Trading Cards category
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true',
        'itemFilter(1).name': 'Condition',
        'itemFilter(1).value': ['New', 'Used'],
        'sortOrder': 'EndTimeSoonest',
        'paginationInput.entriesPerPage': '50',
        'paginationInput.pageNumber': '1'
      };

      const response = await axios.get(this.baseUrl, { params });
      
      if (response.data?.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item) {
        const items = response.data.findCompletedItemsResponse[0].searchResult[0].item;
        console.log(`eBay Service: Found ${items.length} completed listings`);
        return this.parseCompletedItems(items);
      }

      console.log('eBay Service: No completed listings found');
      return [];
    } catch (error) {
      console.error('eBay Service: Error searching completed listings:', error.message);
      throw new Error(`Failed to search eBay completed listings: ${error.message}`);
    }
  }

  async searchActiveListings(card) {
    try {
      console.log(`eBay Service: Searching active listings for card: ${card.name}`);
      
      const searchQuery = this.buildSearchQuery(card);

      const params = {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': this.appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        'keywords': searchQuery,
        'categoryId': '213', // Sports Trading Cards category
        'itemFilter(0).name': 'Condition',
        'itemFilter(0).value': ['New', 'Used'],
        'itemFilter(1).name': 'ListingType',
        'itemFilter(1).value': ['FixedPrice', 'Auction'],
        'sortOrder': 'PricePlusShippingLowest',
        'paginationInput.entriesPerPage': '50',
        'paginationInput.pageNumber': '1'
      };

      const response = await axios.get(this.baseUrl, { params });
      
      if (response.data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item) {
        const items = response.data.findItemsByKeywordsResponse[0].searchResult[0].item;
        console.log(`eBay Service: Found ${items.length} active listings`);
        return this.parseActiveItems(items);
      }

      console.log('eBay Service: No active listings found');
      return [];
    } catch (error) {
      console.error('eBay Service: Error searching active listings:', error.message);
      throw new Error(`Failed to search eBay active listings: ${error.message}`);
    }
  }

  buildSearchQuery(card) {
    // Build a search query from card details
    const parts = [];
    
    if (card.name && card.name !== 'Unknown') {
      parts.push(card.name);
    }
    
    if (card.player && card.player !== 'Unknown') {
      parts.push(card.player);
    }
    
    if (card.year && card.year !== 'Unknown') {
      parts.push(card.year);
    }
    
    if (card.manufacturer && card.manufacturer !== 'Unknown') {
      parts.push(card.manufacturer);
    }
    
    if (card.set && card.set !== 'Unknown') {
      parts.push(card.set);
    }

    if (card.cardNumber && card.cardNumber !== 'Unknown') {
      parts.push(`#${card.cardNumber}`);
    }

    // If we don't have enough details, use a generic search
    if (parts.length === 0) {
      return 'trading card';
    }

    return parts.join(' ');
  }

  parseCompletedItems(items) {
    return items.map(item => {
      const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0);
      const condition = item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown';
      const title = item.title?.[0] || 'Unknown Title';
      const endTime = item.listingInfo?.[0]?.endTime?.[0] || new Date().toISOString();
      const url = item.viewItemURL?.[0] || '';

      return {
        title,
        price,
        condition,
        date: endTime,
        url,
        source: 'eBay'
      };
    }).filter(item => item.price > 0); // Filter out items with no price
  }

  parseActiveItems(items) {
    return items.map(item => {
      const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0);
      const condition = item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown';
      const title = item.title?.[0] || 'Unknown Title';
      const startTime = item.listingInfo?.[0]?.startTime?.[0] || new Date().toISOString();
      const url = item.viewItemURL?.[0] || '';

      return {
        title,
        price,
        condition,
        date: startTime,
        url,
        source: 'eBay'
      };
    }).filter(item => item.price > 0); // Filter out items with no price
  }

  isConfigured() {
    return !!(this.appId && this.certId && this.devId);
  }
}

module.exports = new EbayService();