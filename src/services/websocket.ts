import { io, Socket } from 'socket.io-client';
import { store } from '../store/store';
import { setCurrentBattle, updateBattleStatus, updateBattlePot } from '../store/slices/battleSlice';
import { updateBalance } from '../store/slices/userSlice';

class WebSocketService {
  private socket: Socket | null = null;
  private static instance: WebSocketService;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001');
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('battleUpdate', (battle) => {
      store.dispatch(setCurrentBattle(battle));
    });

    this.socket.on('battleStatus', ({ status, winner }) => {
      store.dispatch(updateBattleStatus({ status, winner }));
    });

    this.socket.on('betPlaced', ({ contestantId, amount }) => {
      store.dispatch(updateBattlePot({ contestantId, amount }));
    });

    this.socket.on('balanceUpdate', (balance) => {
      store.dispatch(updateBalance(balance));
    });
  }

  placeBet(battleId: string, contestantId: string, amount: number) {
    this.socket?.emit('placeBet', { battleId, contestantId, amount });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default WebSocketService.getInstance(); 