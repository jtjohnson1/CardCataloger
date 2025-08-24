import api from './api'

export interface Card {
  _id: string
  frontImage: string
  backImage?: string
  name: string
  manufacturer: string
  year: string
  player: string
  series: string
  cardNumber: string
  estimatedValue: number
  dateAdded: string
  sport: string
  set: string
  condition: string
  lotNumber: string
  iteration: string
}

export interface ProcessingProgress {
  currentCard: Card | null
  completed: number
  total: number
  speed: number
  estimatedTimeRemaining: number
  errors: string[]
}

// Store mock job progress state
const mockJobProgress = new Map<string, { progress: number, startTime: number, completed: boolean }>();

// Helper function to generate realistic-looking trading card placeholder images
const getPlaceholderImage = (width: number = 200, height: number = 280, seed: string = '', isBack: boolean = false) => {
  // Generate a deterministic color based on seed
  const colors = ['4f46e5', '7c3aed', '2563eb', '059669', 'dc2626', 'ea580c'];
  const colorIndex = seed ? seed.charCodeAt(0) % colors.length : 0;
  const color = colors[colorIndex];

  // Card names and details for more realistic placeholders
  const cardData = [
    { name: 'Ken Griffey Jr.', year: '1989', team: 'Mariners', sport: 'Baseball' },
    { name: 'Michael Jordan', year: '1986', team: 'Bulls', sport: 'Basketball' },
    { name: 'Derek Jeter', year: '1993', team: 'Yankees', sport: 'Baseball' },
    { name: 'Wayne Gretzky', year: '1979', team: 'Oilers', sport: 'Hockey' },
    { name: 'Dan Marino', year: '1984', team: 'Dolphins', sport: 'Football' },
    { name: 'Mickey Mantle', year: '1952', team: 'Yankees', sport: 'Baseball' }
  ];

  const cardIndex = parseInt(seed.replace(/\D/g, '') || '0') % cardData.length;
  const card = cardData[cardIndex];

  let svg;

  if (isBack) {
    // Create a card back design
    svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="pattern${seed}" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#${color}"/>
            <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.2)"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pattern${seed})"/>
        <rect x="10" y="10" width="${width-20}" height="${height-20}" fill="none" stroke="white" stroke-width="2" rx="8"/>
        <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="rgba(255,255,255,0.1)" rx="6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">TRADING CARD</text>
        <text x="50%" y="60%" text-anchor="middle" dy=".3em" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="10">OFFICIAL</text>
      </svg>
    `;
  } else {
    // Create a card front design that looks more like a real trading card
    svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#${color}dd;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Card background -->
        <rect width="100%" height="100%" fill="url(#grad${seed})" rx="8"/>

        <!-- Card border -->
        <rect x="4" y="4" width="${width-8}" height="${height-8}" fill="none" stroke="white" stroke-width="2" rx="6"/>

        <!-- Player image area (simulated) -->
        <rect x="15" y="20" width="${width-30}" height="${height-120}" fill="rgba(255,255,255,0.9)" rx="4"/>
        <rect x="20" y="25" width="${width-40}" height="${height-130}" fill="rgba(0,0,0,0.1)" rx="2"/>

        <!-- Player silhouette -->
        <circle cx="${width/2}" cy="${height/2 - 20}" r="${Math.min(width, height)/8}" fill="rgba(0,0,0,0.2)"/>
        <rect x="${width/2 - 15}" y="${height/2 - 10}" width="30" height="40" fill="rgba(0,0,0,0.2)" rx="2"/>

        <!-- Player name -->
        <rect x="10" y="${height-60}" width="${width-20}" height="25" fill="rgba(255,255,255,0.95)" rx="3"/>
        <text x="50%" y="${height-42}" text-anchor="middle" dy=".3em" fill="#333" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${card.name}</text>

        <!-- Team and year -->
        <rect x="10" y="${height-30}" width="${width-20}" height="20" fill="rgba(255,255,255,0.8)" rx="2"/>
        <text x="15" y="${height-15}" dy=".3em" fill="#666" font-family="Arial, sans-serif" font-size="9" font-weight="bold">${card.team}</text>
        <text x="${width-15}" y="${height-15}" text-anchor="end" dy=".3em" fill="#666" font-family="Arial, sans-serif" font-size="9">${card.year}</text>

        <!-- Sport indicator -->
        <circle cx="${width-20}" cy="20" r="12" fill="rgba(255,255,255,0.9)"/>
        <text x="${width-20}" y="20" text-anchor="middle" dy=".3em" fill="#${color}" font-family="Arial, sans-serif" font-size="8" font-weight="bold">${card.sport.charAt(0)}</text>
      </svg>
    `;
  }

  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  return dataUrl;
}

// Description: Create a new card manually
// Endpoint: POST /api/cards
// Request: { name: string, manufacturer?: string, year?: string, player?: string, series?: string, cardNumber?: string, estimatedValue?: number, sport?: string, set?: string, condition?: string, lotNumber: string, iteration: string, frontImage?: string, backImage?: string }
// Response: { success: boolean, message: string, card: Card }
export const createCard = async (cardData: Partial<Card>) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockCard: Card = {
        _id: `507f1f77bcf86cd7${Date.now().toString(16).padStart(8, '0')}`,
        frontImage: cardData.frontImage || getPlaceholderImage(200, 280, `new_${Date.now()}`, false),
        backImage: cardData.backImage || (Math.random() > 0.3 ? getPlaceholderImage(200, 280, `new_${Date.now()}`, true) : undefined),
        name: cardData.name || 'New Card',
        manufacturer: cardData.manufacturer || 'Unknown',
        year: cardData.year || new Date().getFullYear().toString(),
        player: cardData.player || 'Unknown Player',
        series: cardData.series || 'Unknown Series',
        cardNumber: cardData.cardNumber || '1',
        estimatedValue: cardData.estimatedValue || Math.floor(Math.random() * 1000) + 10,
        dateAdded: new Date().toISOString(),
        sport: cardData.sport || 'Baseball',
        set: cardData.set || 'Unknown Set',
        condition: cardData.condition || 'Near Mint',
        lotNumber: cardData.lotNumber || 'manual',
        iteration: cardData.iteration || '00001'
      };

      resolve({
        success: true,
        message: 'Card created successfully',
        card: mockCard
      });
    }, 800);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.post('/api/cards', cardData)
  //   return response.data
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.error || error.message)
  // }
}

// Description: Get all cards from database
// Endpoint: GET /api/cards
// Request: {}
// Response: { cards: Card[] }
export const getCards = async () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockCards: Card[] = [
        {
          _id: '507f1f77bcf86cd799439011',
          frontImage: getPlaceholderImage(200, 280, 'mock1', false),
          backImage: getPlaceholderImage(200, 280, 'mock1', true),
          name: '1989 Upper Deck Ken Griffey Jr.',
          manufacturer: 'Upper Deck',
          year: '1989',
          player: 'Ken Griffey Jr.',
          series: 'Upper Deck Baseball',
          cardNumber: '1',
          estimatedValue: 2500,
          dateAdded: '2024-01-15T10:30:00Z',
          sport: 'Baseball',
          set: 'Upper Deck',
          condition: 'Near Mint',
          lotNumber: 'box1a',
          iteration: '00001'
        },
        {
          _id: '507f1f77bcf86cd799439012',
          frontImage: getPlaceholderImage(200, 280, 'mock2', false),
          backImage: getPlaceholderImage(200, 280, 'mock2', true),
          name: '1986 Fleer Michael Jordan',
          manufacturer: 'Fleer',
          year: '1986',
          player: 'Michael Jordan',
          series: 'Fleer Basketball',
          cardNumber: '57',
          estimatedValue: 15000,
          dateAdded: '2024-01-14T14:20:00Z',
          sport: 'Basketball',
          set: 'Fleer',
          condition: 'Excellent',
          lotNumber: 'box1a',
          iteration: '00002'
        },
        {
          _id: '507f1f77bcf86cd799439013',
          frontImage: getPlaceholderImage(200, 280, 'mock3', false),
          name: '1993 SP Derek Jeter RC',
          manufacturer: 'Upper Deck',
          year: '1993',
          player: 'Derek Jeter',
          series: 'SP Baseball',
          cardNumber: '279',
          estimatedValue: 1200,
          dateAdded: '2024-01-13T09:15:00Z',
          sport: 'Baseball',
          set: 'SP',
          condition: 'Mint',
          lotNumber: 'box1b',
          iteration: '00001'
        },
        {
          _id: '507f1f77bcf86cd799439014',
          frontImage: getPlaceholderImage(200, 280, 'mock4', false),
          backImage: getPlaceholderImage(200, 280, 'mock4', true),
          name: '1979 O-Pee-Chee Wayne Gretzky RC',
          manufacturer: 'O-Pee-Chee',
          year: '1979',
          player: 'Wayne Gretzky',
          series: 'O-Pee-Chee Hockey',
          cardNumber: '18',
          estimatedValue: 8500,
          dateAdded: '2024-01-12T16:45:00Z',
          sport: 'Hockey',
          set: 'O-Pee-Chee',
          condition: 'Very Good',
          lotNumber: 'box2a',
          iteration: '00001'
        },
        {
          _id: '507f1f77bcf86cd799439015',
          frontImage: getPlaceholderImage(200, 280, 'mock5', false),
          backImage: getPlaceholderImage(200, 280, 'mock5', true),
          name: '1984 Topps Dan Marino',
          manufacturer: 'Topps',
          year: '1984',
          player: 'Dan Marino',
          series: 'Topps Football',
          cardNumber: '123',
          estimatedValue: 450,
          dateAdded: '2024-01-11T11:30:00Z',
          sport: 'Football',
          set: 'Topps',
          condition: 'Good',
          lotNumber: 'box2a',
          iteration: '00002'
        },
        {
          _id: '507f1f77bcf86cd799439016',
          frontImage: getPlaceholderImage(200, 280, 'mock6', false),
          backImage: getPlaceholderImage(200, 280, 'mock6', true),
          name: '1952 Topps Mickey Mantle',
          manufacturer: 'Topps',
          year: '1952',
          player: 'Mickey Mantle',
          series: 'Topps Baseball',
          cardNumber: '311',
          estimatedValue: 125000,
          dateAdded: '2024-01-10T08:00:00Z',
          sport: 'Baseball',
          set: 'Topps',
          condition: 'Fair',
          lotNumber: 'vintage1',
          iteration: '00001'
        }
      ];

      resolve({ cards: mockCards });
    }, 600);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/cards')
  //   return response.data
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.error || error.message)
  // }
}

// Description: Get card by ID
// Endpoint: GET /api/cards/:id
// Request: {}
// Response: { card: Card }
export const getCardById = async (id: string) => {
  // Mocking the response
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('getCardById: Searching for card with ID:', id);
      
      // Find the card from our mock data
      const mockCards = [
        {
          _id: '507f1f77bcf86cd799439011',
          frontImage: getPlaceholderImage(200, 280, 'mock1', false),
          backImage: getPlaceholderImage(200, 280, 'mock1', true),
          name: '1989 Upper Deck Ken Griffey Jr.',
          manufacturer: 'Upper Deck',
          year: '1989',
          player: 'Ken Griffey Jr.',
          series: 'Upper Deck Baseball',
          cardNumber: '1',
          estimatedValue: 2500,
          dateAdded: '2024-01-15T10:30:00Z',
          sport: 'Baseball',
          set: 'Upper Deck',
          condition: 'Near Mint',
          lotNumber: 'box1a',
          iteration: '00001'
        },
        {
          _id: '507f1f77bcf86cd799439012',
          frontImage: getPlaceholderImage(200, 280, 'mock2', false),
          backImage: getPlaceholderImage(200, 280, 'mock2', true),
          name: '1986 Fleer Michael Jordan',
          manufacturer: 'Fleer',
          year: '1986',
          player: 'Michael Jordan',
          series: 'Fleer Basketball',
          cardNumber: '57',
          estimatedValue: 15000,
          dateAdded: '2024-01-14T14:20:00Z',
          sport: 'Basketball',
          set: 'Fleer',
          condition: 'Excellent',
          lotNumber: 'box1a',
          iteration: '00002'
        }
      ];

      console.log('getCardById: Available card IDs:', mockCards.map(c => c._id));
      console.log('getCardById: Looking for exact match with:', id);
      
      const card = mockCards.find(c => c._id === id);
      console.log('getCardById: Found card:', card ? card.name : 'NOT FOUND');
      
      if (card) {
        resolve({ card });
      } else {
        console.log('getCardById: Card not found, rejecting with error');
        reject(new Error('Card not found'));
      }
    }, 400);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get(`/api/cards/${id}`)
  //   return response.data
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.error || error.message)
  // }
}

// Description: Process selected cards from directory
// Endpoint: POST /api/cards/process
// Request: { directory: string, includeSubdirectories: boolean, selectedCards: string[] }
// Response: { success: boolean, message: string, jobId: string }
export const processCards = async (data: { directory: string; includeSubdirectories: boolean; selectedCards: string[] }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Processing started',
        jobId: `job_${Date.now()}`,
        cardCount: data.selectedCards.length
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.post('/api/cards/process', data)
  //   return response.data
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.error || error.message)
  // }
}

// Description: Get processing progress
// Endpoint: GET /api/cards/progress/:jobId
// Request: {}
// Response: ProcessingProgress
export const getProcessingProgress = async (jobId: string) => {
  // Mocking the response with simulated realistic progress
  return new Promise((resolve) => {
    setTimeout(() => {
      // Initialize job if not exists
      if (!mockJobProgress.has(jobId)) {
        mockJobProgress.set(jobId, {
          progress: 0,
          startTime: Date.now(),
          completed: false
        });
      }

      const jobState = mockJobProgress.get(jobId)!;
      const elapsed = Date.now() - jobState.startTime;

      // Simulate progress over 30 seconds (30000ms)
      const totalDuration = 30000;
      let progressPercent = Math.min(100, (elapsed / totalDuration) * 100);

      // Update job state
      jobState.progress = progressPercent;
      if (progressPercent >= 100) {
        jobState.completed = true;
      }

      const total = 5;
      const completed = Math.floor((progressPercent / 100) * total);

      resolve({
        currentCard: completed < total && !jobState.completed ? {
          _id: `507f1f77bcf86cd7${Date.now().toString(16).padStart(8, '0')}`,
          frontImage: getPlaceholderImage(200, 280, `current_${completed + 1}`, false),
          backImage: getPlaceholderImage(200, 280, `current_${completed + 1}`, true),
          name: `Processing Card ${completed + 1}`,
          manufacturer: 'Unknown',
          year: '2024',
          player: 'Unknown',
          series: 'Processing',
          cardNumber: `${completed + 1}`,
          estimatedValue: 0,
          dateAdded: new Date().toISOString(),
          sport: 'Unknown',
          set: 'Unknown',
          condition: 'Unknown',
          lotNumber: 'box1a',
          iteration: `0000${completed + 1}`
        } : null,
        completed: jobState.completed ? total : completed,
        total,
        speed: 2.5,
        estimatedTimeRemaining: jobState.completed ? 0 : Math.max(0, (total - completed) / 2.5),
        errors: []
      });
    }, 300);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get(`/api/cards/progress/${jobId}`)
  //   return response.data
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.error || error.message)
  // }
}

// Description: Delete selected cards
// Endpoint: DELETE /api/cards
// Request: { cardIds: string[] }
// Response: { success: boolean, message: string, deletedCount: number }
export const deleteCards = async (cardIds: string[]) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `${cardIds.length} cards deleted successfully`,
        deletedCount: cardIds.length
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.delete('/api/cards', { data: { cardIds } })
  //   return response.data
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.error || error.message)
  // }
}

// Description: Scan directory for card images
// Endpoint: POST /api/cards/scan-directory
// Request: { directory: string, includeSubdirectories: boolean }
// Response: { cards: Array<{ frontImage: string, backImage?: string, lotNumber: string, iteration: string }>, totalImages: number, validPairs: number, singleCards: number }
export const scanDirectory = async (data: { directory: string; includeSubdirectories: boolean }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('scanDirectory - Returning mock scan results with realistic card images');
      resolve({
        cards: [
          {
            frontImage: getPlaceholderImage(200, 280, 'scan1', false),
            backImage: getPlaceholderImage(200, 280, 'scan1', true),
            lotNumber: 'box1a',
            iteration: '00001'
          },
          {
            frontImage: getPlaceholderImage(200, 280, 'scan2', false),
            backImage: getPlaceholderImage(200, 280, 'scan2', true),
            lotNumber: 'box1a',
            iteration: '00002'
          },
          {
            frontImage: getPlaceholderImage(200, 280, 'scan3', false),
            lotNumber: 'box1a',
            iteration: '00003'
          },
          {
            frontImage: getPlaceholderImage(200, 280, 'scan4', false),
            backImage: getPlaceholderImage(200, 280, 'scan4', true),
            lotNumber: 'box1b',
            iteration: '00001'
          },
          {
            frontImage: getPlaceholderImage(200, 280, 'scan5', false),
            backImage: getPlaceholderImage(200, 280, 'scan5', true),
            lotNumber: 'box1b',
            iteration: '00002'
          }
        ],
        totalImages: 9,
        validPairs: 4,
        singleCards: 1
      });
    }, 800);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.post('/api/cards/scan-directory', data)
  //   return response.data
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.error || error.message)
  // }
}