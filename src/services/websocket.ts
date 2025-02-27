import { io, Socket } from 'socket.io-client';
import { store } from '../store/store';
import { setCurrentBattle, updateBattleStatus, updateBattlePot } from '../store/slices/battleSlice';
import { updateBalance } from '../store/slices/userSlice';

class WebSocketService {
  private socket: Socket | null = null;
  private static instance: WebSocketService;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect() {
    if (this.socket || !process.browser) return;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
      console.log('Connecting to WebSocket:', wsUrl);
      
      this.socket = io(wsUrl, {
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        autoConnect: true
      });

      if (!this.isInitialized) {
        this.setupEventListeners();
        this.setupErrorHandling();
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0;
    });

    this.socket.on('battleUpdate', (battle) => {
      try {
        console.log('Received battle update:', battle);
        if (battle && typeof battle === 'object') {
          store.dispatch(setCurrentBattle(battle));
        }
      } catch (error) {
        console.error('Error handling battle update:', error);
      }
    });

    this.socket.on('battleStatus', ({ status, winner }) => {
      try {
        console.log('Received battle status update:', { status, winner });
        if (status) {
          store.dispatch(updateBattleStatus({ status, winner }));
        }
      } catch (error) {
        console.error('Error handling battle status:', error);
      }
    });

    this.socket.on('betPlaced', ({ contestantId, amount }) => {
      try {
        console.log('Bet placed:', { contestantId, amount });
        if (contestantId && typeof amount === 'number') {
          store.dispatch(updateBattlePot({ contestantId, amount }));
        }
      } catch (error) {
        console.error('Error handling bet placement:', error);
      }
    });

    this.socket.on('balanceUpdate', (balance) => {
      try {
        console.log('Balance updated:', balance);
        if (typeof balance === 'number') {
          store.dispatch(updateBalance(balance));
        }
      } catch (error) {
        console.error('Error handling balance update:', error);
      }
    });
  }

  private setupErrorHandling() {
    if (!this.socket) return;

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.handleReconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Add ping/pong for connection health check
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000);

    this.socket.on('pong', () => {
      console.log('Received pong from server');
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        } else {
          this.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.cleanup();
    }
  }

  placeBet(battleId: string, contestantId: string, amount: number) {
    if (!this.socket?.connected) {
      console.error('Cannot place bet: WebSocket not connected');
      return Promise.reject(new Error('WebSocket not connected'));
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket!.emit('placeBet', { battleId, contestantId, amount }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });

        // Add timeout for bet placement
        setTimeout(() => {
          reject(new Error('Bet placement timeout'));
        }, 5000);
      } catch (error) {
        console.error('Error placing bet:', error);
        reject(error);
      }
    });
  }

  cleanup() {
    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
        this.reconnectAttempts = 0;
        this.isInitialized = false;
      } catch (error) {
        console.error('Error during WebSocket cleanup:', error);
      }
    }
  }

  disconnect() {
    this.cleanup();
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

const webSocketService = WebSocketService.getInstance();

// Handle cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    webSocketService.cleanup();
  });
}

export default webSocketService; 