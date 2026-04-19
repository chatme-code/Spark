import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MessageType = 'text' | 'gift' | 'photo' | 'video' | 'system';

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  type: MessageType;
  mediaUri?: string;
  giftEmoji?: string;
  giftName?: string;
  giftCost?: number;
  mediaOpened?: boolean;
  createdAt: string;
  read: boolean;
}

interface ChatContextType {
  getMessages: (matchId: string) => ChatMessage[];
  sendMessage: (matchId: string, text: string, senderId: string) => Promise<void>;
  sendSpecialMessage: (matchId: string, msg: Partial<ChatMessage>) => Promise<ChatMessage>;
  updateMessage: (matchId: string, msgId: string, patch: Partial<ChatMessage>) => Promise<void>;
  loadMessages: () => Promise<void>;
  getLastMessage: (matchId: string) => ChatMessage | null;
  getUnreadCount: (matchId: string) => number;
  markRead: (matchId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);
const CHAT_KEY = '@spark_chat';

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_KEY);
      if (stored) {
        setAllMessages(JSON.parse(stored));
      }
    } catch {}
  };

  const save = async (data: Record<string, ChatMessage[]>) => {
    await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(data));
  };

  const getMessages = useCallback(
    (matchId: string): ChatMessage[] => allMessages[matchId] ?? [],
    [allMessages]
  );

  const sendSpecialMessage = useCallback(
    async (matchId: string, partial: Partial<ChatMessage>): Promise<ChatMessage> => {
      const msg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        matchId,
        senderId: 'user',
        text: '',
        type: 'text',
        createdAt: new Date().toISOString(),
        read: true,
        ...partial,
      };
      const current = allMessages[matchId] ?? [];
      const updated = { ...allMessages, [matchId]: [...current, msg] };
      setAllMessages(updated);
      await save(updated);
      return msg;
    },
    [allMessages]
  );

  const updateMessage = useCallback(
    async (matchId: string, msgId: string, patch: Partial<ChatMessage>) => {
      setAllMessages((prev) => {
        const msgs = prev[matchId] ?? [];
        const updated = msgs.map((m) => (m.id === msgId ? { ...m, ...patch } : m));
        const newData = { ...prev, [matchId]: updated };
        save(newData);
        return newData;
      });
    },
    []
  );

  const sendMessage = useCallback(
    async (matchId: string, text: string, senderId: string) => {
      const msg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        matchId,
        senderId,
        text,
        type: 'text',
        createdAt: new Date().toISOString(),
        read: true,
      };

      const current = allMessages[matchId] ?? [];
      const updated = { ...allMessages, [matchId]: [...current, msg] };
      setAllMessages(updated);
      await save(updated);

      // Simulate a reply after a short delay
      setTimeout(async () => {
        const replies = [
          "That sounds amazing!",
          "Haha, I love that!",
          "Tell me more 😊",
          "Really? That's so interesting!",
          "I was just thinking the same thing!",
          "We definitely have to try that sometime",
          "You seem really fun to hang out with",
          "What are you up to this weekend?",
        ];
        const reply: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          matchId,
          senderId: matchId,
          text: replies[Math.floor(Math.random() * replies.length)],
          createdAt: new Date().toISOString(),
          read: false,
        };
        setAllMessages((prev) => {
          const prevMsgs = prev[matchId] ?? [];
          const newData = { ...prev, [matchId]: [...prevMsgs, reply] };
          save(newData);
          return newData;
        });
      }, 1500 + Math.random() * 2000);
    },
    [allMessages]
  );

  const getLastMessage = useCallback(
    (matchId: string): ChatMessage | null => {
      const msgs = allMessages[matchId];
      if (!msgs || msgs.length === 0) return null;
      return msgs[msgs.length - 1];
    },
    [allMessages]
  );

  const getUnreadCount = useCallback(
    (matchId: string): number => {
      const msgs = allMessages[matchId] ?? [];
      return msgs.filter((m) => !m.read && m.senderId !== 'user').length;
    },
    [allMessages]
  );

  const markRead = useCallback(
    async (matchId: string) => {
      const msgs = allMessages[matchId] ?? [];
      const updated = msgs.map((m) => ({ ...m, read: true }));
      const newData = { ...allMessages, [matchId]: updated };
      setAllMessages(newData);
      await save(newData);
    },
    [allMessages]
  );

  return (
    <ChatContext.Provider value={{ getMessages, sendMessage, sendSpecialMessage, updateMessage, loadMessages, getLastMessage, getUnreadCount, markRead }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
