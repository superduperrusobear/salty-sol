import { db } from '@/config/firebase';
import { ref, push, query, orderByChild, limitToLast, onValue, serverTimestamp, set } from 'firebase/database';

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

  // Clean up all listeners
  cleanup(): void {
    this.messageListeners.forEach(unsubscribe => unsubscribe());
    this.messageListeners.clear();
  }
}

// Export singleton instance
export const chatService = new ChatService(); 