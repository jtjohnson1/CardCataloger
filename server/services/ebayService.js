const axios = require('axios');

class EbayService {
  constructor() {
    this.appId = process.env.EBAY_APP_ID;
    this.certId = process.env.EBAY_CERT_ID;
    this.devId = process.env.EBAY_DEV_ID;
    this.userToken = process.env.EBAY_USER_TOKEN;
    this.sandbox = process.env.EBAY_SANDBOX === 'true';

    this.baseUrl = this.sandbox
      ? 'https://api.sandbox.ebay.com'
      : 'https://api.ebay.com';

    console.log('EbayService initialized');
  }

  async searchCompletedListings(query, options = {}) {
    try {
      console.log(`EbayService.searchCompletedListings called for: ${query}`);

      if (!this.appId || !this.certId) {
        throw new Error('eBay API credentials not configured');
      }

      const params = {
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': this.appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': query,
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true',
        'sortOrder': 'EndTimeSoonest',
        'paginationInput.entriesPerPage': '10'
      };

      const response = await this.makeRequest('/services/search/FindingService/v1', params);

      // Parse eBay response and return structured data
      const items = response.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];

      return items.map(item => ({
        title: item.title?.[0] || 'Unknown',
        price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'),
        condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown',
        endDate: item.listingInfo?.[0]?.endTime?.[0] || new Date().toISOString(),
        shipping: parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || '0')
      }));

    } catch (error) {
      console.error('Error in EbayService.searchCompletedListings:', error);
      throw error;
    }
  }

  async searchActiveListings(query, options = {}) {
    try {
      console.log(`EbayService.searchActiveListings called for: ${query}`);

      if (!this.appId) {
        throw new Error('eBay API credentials not configured');
      }

      const params = {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': this.appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': query,
        'sortOrder': 'PricePlusShippingLowest',
        'paginationInput.entriesPerPage': '10'
      };

      const response = await this.makeRequest('/services/search/FindingService/v1', params);

      // Parse eBay response and return structured data
      const items = response.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];

      return items.map(item => ({
        title: item.title?.[0] || 'Unknown',
        price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'),
        condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown',
        listingDate: item.listingInfo?.[0]?.startTime?.[0] || new Date().toISOString(),
        shipping: parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || '0')
      }));

    } catch (error) {
      console.error('Error in EbayService.searchActiveListings:', error);
      throw error;
    }
  }

  async makeRequest(endpoint, params = {}) {
    try {
      console.log(`EbayService.makeRequest called for endpoint: ${endpoint}`);

      const config = {
        method: 'GET',
        url: `${this.baseUrl}${endpoint}`,
        params,
        headers: {
          'X-EBAY-API-APP-ID': this.appId,
          'X-EBAY-API-CERT-ID': this.certId,
          'X-EBAY-API-DEV-ID': this.devId,
          'X-EBAY-API-CALL-NAME': 'FindCompletedItems',
          'X-EBAY-API-VERSION': '1.13.0',
          'X-EBAY-API-REQUEST-ENCODING': 'JSON',
          'X-EBAY-API-RESPONSE-ENCODING': 'JSON'
        },
        timeout: 10000
      };

      const response = await axios(config);
      console.log(`EbayService.makeRequest - Request successful for: ${endpoint}`);
      return response.data;
    } catch (error) {
      console.error('Error in EbayService.makeRequest:', error);
      throw error;
    }
  }
}

module.exports = EbayService;