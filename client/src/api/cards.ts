import api from './api';

export interface Card {
  _id: string;
  name: string;
  manufacturer: string;
  year: number;
  player: string;
  team: string;
  cardNumber: string;
  series: string;
  condition: string;
  estimatedValue: number;
  images: {
    front: string;
    back?: string;
  };
  fileInfo: {
    frontFile: string;
    backFile?: string;
    lotNumber: string;
    iteration: string;
  };
  dateAdded: string;
}

export interface CardPair {
  id: string;
  frontFile: string;
  backFile?: string;
  lotNumber: string;
  iteration: string;
  hasBack: boolean;
}

export interface ScanResult {
  totalImages: number;
  validPairs: CardPair[];
  singleCards: CardPair[];
}

export interface ProcessingProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentCard?: string;
  cardsCompleted: number;
  totalCards: number;
  estimatedTimeRemaining?: number;
  errors: string[];
}

// Description: Scan directory for card files
// Endpoint: POST /api/cards/scan
// Request: { directory: string, includeSubdirectories: boolean }
// Response: { success: boolean, data: ScanResult }
export const scanDirectory = async (data: { directory: string; includeSubdirectories: boolean }) => {
  try {
    console.log('scanDirectory API call - Request:', data);
    const response = await api.post('/api/cards/scan', data);
    console.log('scanDirectory API call - Response:', response.data);
    
    // Ensure the response has the expected structure
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Scan failed');
    }
    
    if (!response.data.data) {
      throw new Error('No scan data received from server');
    }
    
    // Validate the scan result structure
    const scanResult = response.data.data;
    if (!scanResult.validPairs) {
      scanResult.validPairs = [];
    }
    if (!scanResult.singleCards) {
      scanResult.singleCards = [];
    }
    if (typeof scanResult.totalImages !== 'number') {
      scanResult.totalImages = (scanResult.validPairs?.length || 0) + (scanResult.singleCards?.length || 0);
    }
    
    console.log('scanDirectory API call - Processed result:', scanResult);
    return response.data;
  } catch (error: any) {
    console.error('scanDirectory API call - Error:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Start processing selected cards
// Endpoint: POST /api/cards/process
// Request: { selectedCards: string[], directory: string }
// Response: { success: boolean, jobId: string }
export const processCards = async (data: { selectedCards: string[]; directory: string }) => {
  try {
    const response = await api.post('/api/cards/process', data);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get processing progress
// Endpoint: GET /api/cards/progress/:jobId
// Request: {}
// Response: { progress: ProcessingProgress }
export const getProcessingProgress = async (jobId: string) => {
  try {
    const response = await api.get(`/api/cards/progress/${jobId}`);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get all cards
// Endpoint: GET /api/cards
// Request: {}
// Response: { cards: Card[] }
export const getCards = async () => {
  try {
    const response = await api.get('/api/cards');
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get a specific card by ID
// Endpoint: GET /api/cards/:id
// Request: {}
// Response: { card: Card }
export const getCard = async (id: string) => {
  try {
    const response = await api.get(`/api/cards/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Create a new card
// Endpoint: POST /api/cards
// Request: { card: Partial<Card> }
// Response: { success: boolean, card: Card }
export const createCard = async (cardData: Partial<Card>) => {
  try {
    const response = await api.post('/api/cards', cardData);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update an existing card
// Endpoint: PUT /api/cards/:id
// Request: { card: Partial<Card> }
// Response: { success: boolean, card: Card }
export const updateCard = async (id: string, cardData: Partial<Card>) => {
  try {
    const response = await api.put(`/api/cards/${id}`, cardData);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Delete a card
// Endpoint: DELETE /api/cards/:id
// Request: {}
// Response: { success: boolean }
export const deleteCard = async (id: string) => {
  try {
    const response = await api.delete(`/api/cards/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Delete multiple cards
// Endpoint: DELETE /api/cards/bulk
// Request: { cardIds: string[] }
// Response: { success: boolean, deletedCount: number }
export const deleteCards = async (cardIds: string[]) => {
  try {
    const response = await api.delete('/api/cards/bulk', { data: { cardIds } });
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Delete cards by wildcard pattern
// Endpoint: DELETE /api/cards/wildcard
// Request: { pattern: string }
// Response: { success: boolean, deletedCount: number }
export const deleteCardsByPattern = async (pattern: string) => {
  try {
    const response = await api.delete('/api/cards/wildcard', { data: { pattern } });
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Utility functions for image handling
export const generatePlaceholderImage = (width: number = 200, height: number = 280, text: string = 'Card Image') => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0" stroke="#ddd" stroke-width="2"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#666" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `)}`;
};

export const getCardImageUrl = (imagePath: string) => {
  if (!imagePath) return generatePlaceholderImage();
  if (imagePath.startsWith('data:')) return imagePath;
  if (imagePath.startsWith('http')) return imagePath;
  return `/api/cards/image/${encodeURIComponent(imagePath)}`;
};