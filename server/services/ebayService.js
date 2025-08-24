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
      
      // Mock implementation for now
      const mockResults = [
        {
          title: `${query} - Card`,
          price: Math.random() * 100 + 10,
          condition: 'Near Mint',
          endDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          shipping: 3.99
        },
        {
          title: `${query} Trading Card`,
          price: Math.random() * 80 + 15,
          condition: 'Excellent',
          endDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
          shipping: 4.50
        }
      ];

      console.log(`EbayService.searchCompletedListings - Found ${mockResults.length} results`);
      return mockResults;
    } catch (error) {
      console.error('Error in EbayService.searchCompletedListings:', error);
      throw error;
    }
  }

  async searchActiveListings(query, options = {}) {
    try {
      console.log(`EbayService.searchActiveListings called for: ${query}`);
      
      // Mock implementation for now
      const mockResults = [
        {
          title: `${query} PSA Graded`,
          price: Math.random() * 120 + 20,
          condition: 'Mint',
          listingDate: new Date().toISOString(),
          shipping: 5.99
        }
      ];

      console.log(`EbayService.searchActiveListings - Found ${mockResults.length} results`);
      return mockResults;
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