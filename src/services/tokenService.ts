import axios from 'axios';
import { ref, onValue, set } from 'firebase/database';
import { db } from '@/config/firebase';

interface TokenData {
  name: string;
  symbol: string;
  mint: string;
  uri: string;
  decimals: number;
  image: string;
  description: string;
  marketCap?: {
    usd: number;
  };
  volume?: number;
  price?: number;
  supply?: number;
  created_at?: string;
  twitter?: string;
  token?: any;
  lastUpdated?: number;
  pools?: Array<{
    marketCap?: {
      usd: number;
    };
    txns?: {
      volume: number;
    };
    price?: {
      usd: number;
    };
  }>;
}

interface PoolData {
  marketCap: {
    quote: number;
    usd: number;
  };
  tokenAddress: string;
  market: string;
  createdAt: number;
  poolId: string;
  txns?: {
    volume: number;
  };
  price?: {
    usd: number;
  };
}

interface CachedData {
  timestamp: number;
  data: TokenData[];
  usedPairs: Set<string>;
}

const API_KEY = 'cbbff4e0-dc44-4106-9e43-2b54667ea532';
const BASE_URL = 'https://data.solanatracker.io';
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds

const MOCK_TOKENS: TokenData[] = [
  {
    name: "Automatic Treasury Machine",
    symbol: "ATM",
    mint: "8QhSMvYfXome11VgxFMD75hNbGQXW5QTnjA8khENkY2c",
    uri: "",
    decimals: 9,
    image: "/FALLBACKS/atm.webp",
    description: "Automatic Treasury Machine",
    marketCap: { usd: 1800000 },
    volume: 500000,
    price: 0.00001,
  },
  {
    name: "The Dark Money Cabal",
    symbol: "WOKETOPUS",
    mint: "jBtB8GxumYHewQfporaaUXRSY9pM5Q4zQDxd72zpump",
    uri: "",
    decimals: 9,
    image: "/FALLBACKS/woke.webp",
    description: "The Dark Money Cabal",
    marketCap: { usd: 2600000 },
    volume: 750000,
    price: 0.000015,
  }
];

class TokenService {
  private cache: CachedData | null = null;
  private poolDataCallbacks: ((data: PoolData) => void)[] = [];
  private axiosInstance;
  private unsubscribeTokens: (() => void) | null = null;
  private lastFetchTimestamp: number = 0;
  private fetchPromise: Promise<TokenData[]> | null = null;
  private trendingTokens: TokenData[] = [];
  private isFirstLoad: boolean = true;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    this.initializeRTDBListeners();
    // Start fetching trending tokens immediately
    this.startTrendingTokensFetch();
  }

  private initializeRTDBListeners() {
    try {
      const tokensRef = ref(db, 'tokens');
      
      this.unsubscribeTokens = onValue(tokensRef, (snapshot) => {
        if (snapshot.exists()) {
          const tokens = Object.values(snapshot.val()) as TokenData[];
          
          if (!this.cache) {
            this.cache = {
              timestamp: Date.now(),
              data: tokens,
              usedPairs: new Set()
            };
          } else {
            this.cache.data = tokens;
          }

          // Notify pool data subscribers
          const poolData: PoolData = {
            marketCap: {
              quote: 0,
              usd: tokens.reduce((sum, token) => sum + (token.marketCap?.usd || 0), 0)
            },
            tokenAddress: '',
            market: 'ALL',
            createdAt: Date.now(),
            poolId: 'global'
          };

          this.poolDataCallbacks.forEach(callback => callback(poolData));
        }
      });
    } catch (error) {
      console.error('Failed to initialize RTDB listeners:', error);
    }
  }

  private async startTrendingTokensFetch() {
    try {
      // Initial fetch
      await this.fetchAndStoreTrendingTokens();
      
      // Set up interval for periodic updates (every 1 hour)
      setInterval(() => {
        this.fetchAndStoreTrendingTokens();
      }, 60 * 60 * 1000); // 1 hour
    } catch (error) {
      console.error('Error starting trending tokens fetch:', error);
    }
  }

  private async fetchAndStoreTrendingTokens() {
    try {
      console.log('Fetching hourly trending tokens...');
      const response = await this.axiosInstance.get('/tokens/trending/1h');
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid API response format');
      }

      const tokens = response.data
        .map((item: any) => ({
          ...item.token,
          marketCap: item.marketCap || item.pools?.[0]?.marketCap,
          volume: item.pools?.[0]?.txns?.volume,
          price: item.pools?.[0]?.price?.usd,
          image: item.token?.image || `/FALLBACKS/${item.token?.symbol?.toLowerCase()}.webp`,
          lastUpdated: Date.now()
        }))
        .filter((token: TokenData) => 
          token.mint && 
          token.name && 
          token.symbol && 
          (token.marketCap?.usd || token.volume)
        )
        .slice(0, 25); // Keep top 25 tokens

      if (tokens.length > 0) {
        this.trendingTokens = tokens;
        this.isFirstLoad = false;

        // Store in Firebase
        const tokensRef = ref(db, 'tokens/trending');
        await set(tokensRef, tokens);

        console.log('Updated trending tokens:', tokens.length);
      }
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
    }
  }

  public async getTrendingTokens(timeframe: string = '1h'): Promise<TokenData[]> {
    // Always return mock tokens for the first battle
    if (this.isFirstLoad) {
      console.log('First load - using mock tokens');
      return MOCK_TOKENS;
    }

    // If we have trending tokens, use them
    if (this.trendingTokens.length >= 2) {
      console.log('Using cached trending tokens');
      return this.trendingTokens;
    }

    // If no trending tokens yet, try to fetch them
    try {
      await this.fetchAndStoreTrendingTokens();
      if (this.trendingTokens.length >= 2) {
        return this.trendingTokens;
      }
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
    }

    // Fallback to mock tokens if all else fails
    console.log('Falling back to mock tokens');
    return MOCK_TOKENS;
  }

  public getUnusedTokenPair(tokens: TokenData[]): { token1: TokenData; token2: TokenData } {
    if (this.isFirstLoad || tokens.length < 2) {
      const [token1, token2] = MOCK_TOKENS;
      return { token1, token2 };
    }

    // Filter out previously used pairs
    const availableTokens = tokens.filter(token => 
      !Array.from(this.cache?.usedPairs || new Set()).some(pair => pair.includes(token.mint))
    );

    if (availableTokens.length < 2) {
      // Reset used pairs if we don't have enough unused tokens
      if (this.cache) {
        this.cache.usedPairs.clear();
      }
      // Try again with all tokens
      const shuffled = [...tokens].sort(() => Math.random() - 0.5);
      const [token1, token2] = shuffled.slice(0, 2);
      
      // Mark this pair as used
      if (this.cache) {
        this.cache.usedPairs.add(`${token1.mint}-${token2.mint}`);
      }
      
      return { token1, token2 };
    }

    // Randomly select two tokens
    const shuffled = [...availableTokens].sort(() => Math.random() - 0.5);
    const [token1, token2] = shuffled.slice(0, 2);

    // Mark this pair as used
    if (this.cache) {
      this.cache.usedPairs.add(`${token1.mint}-${token2.mint}`);
    }

    return { token1, token2 };
  }

  public onPoolData(callback: (data: PoolData) => void) {
    this.poolDataCallbacks.push(callback);
    return () => {
      this.poolDataCallbacks = this.poolDataCallbacks.filter(cb => cb !== callback);
    };
  }

  public disconnect() {
    if (this.unsubscribeTokens) {
      this.unsubscribeTokens();
      this.unsubscribeTokens = null;
    }
  }

  public formatNumber(num: number): string {
    if (!num) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }
}

// Export singleton instance
export const tokenService = new TokenService(); 