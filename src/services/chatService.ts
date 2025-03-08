import { db } from '@/config/firebase';
import { ref, push, query, orderByChild, limitToLast, onValue, serverTimestamp, set, get, remove } from 'firebase/database';

export interface ChatMessage {
  id?: string;
  username: string;
  text: string;
  timestamp: number;
  isSystemMessage?: boolean;
}

class ChatService {
  private messagesRef = ref(db, 'chat/messages');
  private messageListeners: Map<string, () => void> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly MAX_MESSAGES = 50; // Maximum number of messages to keep

  constructor() {
    // Start the cleanup interval when the service is instantiated
    this.startCleanupInterval();
  }

  // Subscribe to new messages
  onNewMessages(callback: (messages: ChatMessage[]) => void, limit: number = 100): () => void {
    console.log('Setting up chat listener...');
    
    const messagesQuery = query(
      this.messagesRef,
      orderByChild('timestamp'),
      limitToLast(limit)
    );

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        messages.push({
          id: childSnapshot.key,
          username: data.username,
          text: data.text,
          timestamp: data.timestamp || Date.now(),
          isSystemMessage: !!data.isSystemMessage
        });
      });
      
      callback(messages.sort((a, b) => a.timestamp - b.timestamp));
    });

    const listenerId = Date.now().toString();
    this.messageListeners.set(listenerId, unsubscribe);

    return () => {
      if (this.messageListeners.has(listenerId)) {
        this.messageListeners.get(listenerId)!();
        this.messageListeners.delete(listenerId);
      }
    };
  }

  // Send a new message
  async sendMessage(username: string, text: string, isSystem: boolean = false): Promise<void> {
    if (!text.trim()) return;

    const message = {
      username,
      text: text.trim(),
      timestamp: Date.now(),
      isSystemMessage: isSystem,
      _serverTime: serverTimestamp()
    };

    const newMessageRef = push(this.messagesRef);
    await set(newMessageRef, message);
  }

  // Send a system message
  async sendSystemMessage(text: string): Promise<void> {
    return this.sendMessage('System', text, true);
  }

  // Start the cleanup interval
  startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Clean up messages every 25 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMessages().catch(err => 
        console.error('Error cleaning up old messages:', err)
      );
    }, 25000); // 25 seconds
  }

  // Clean up old messages, keeping only the most recent ones
  async cleanupOldMessages(): Promise<void> {
    try {
      // Get all messages ordered by timestamp
      const messagesQuery = query(
        this.messagesRef,
        orderByChild('timestamp')
      );
      
      const snapshot = await get(messagesQuery);
      if (!snapshot.exists()) return;
      
      const messages: { key: string; timestamp: number }[] = [];
      
      // Collect all message keys and timestamps
      snapshot.forEach(childSnapshot => {
        const data = childSnapshot.val();
        messages.push({
          key: childSnapshot.key!,
          timestamp: data.timestamp || 0
        });
      });
      
      // Sort by timestamp (oldest first)
      messages.sort((a, b) => a.timestamp - b.timestamp);
      
      // If we have more than MAX_MESSAGES, remove the oldest ones
      if (messages.length > this.MAX_MESSAGES) {
        const messagesToRemove = messages.slice(0, messages.length - this.MAX_MESSAGES);
        
        // Remove each message
        for (const message of messagesToRemove) {
          await remove(ref(db, `chat/messages/${message.key}`));
        }
        
        console.log(`Cleaned up ${messagesToRemove.length} old chat messages`);
      }
    } catch (error) {
      console.error('Error cleaning up old messages:', error);
      throw error;
    }
  }

  // Clean up all listeners and intervals
  cleanup(): void {
    this.messageListeners.forEach(unsubscribe => unsubscribe());
    this.messageListeners.clear();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService(); 