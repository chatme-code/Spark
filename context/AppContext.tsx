import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_PROFILES, MockProfile } from '@/data/mockProfiles';

export interface Match {
  id: string;
  profile: MockProfile;
  matchedAt: string;
  hasNewMessage: boolean;
}

export interface AppNotification {
  id: string;
  type: 'match' | 'message' | 'like' | 'system';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

interface AppContextType {
  discoveryProfiles: MockProfile[];
  matches: Match[];
  notifications: AppNotification[];
  unreadNotifications: number;
  swipeRight: (profile: MockProfile) => Promise<{ isMatch: boolean }>;
  swipeLeft: (profile: MockProfile) => void;
  superLike: (profile: MockProfile) => Promise<{ isMatch: boolean }>;
  undoSwipe: (profile: MockProfile) => void;
  markNotificationsRead: () => void;
  markMatchMessageRead: (matchId: string) => void;
  reloadProfiles: () => void;
}

const AppContext = createContext<AppContextType | null>(null);
const MATCHES_KEY = '@spark_matches';
const NOTIFS_KEY = '@spark_notifications';
const SWIPED_KEY = '@spark_swiped';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [discoveryProfiles, setDiscoveryProfiles] = useState<MockProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [swipedIds, setSwipedIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [matchesData, notifsData, swipedData] = await Promise.all([
        AsyncStorage.getItem(MATCHES_KEY),
        AsyncStorage.getItem(NOTIFS_KEY),
        AsyncStorage.getItem(SWIPED_KEY),
      ]);
      const loadedMatches: Match[] = matchesData ? JSON.parse(matchesData) : [];
      const loadedNotifs: AppNotification[] = notifsData ? JSON.parse(notifsData) : [];
      const loadedSwiped: string[] = swipedData ? JSON.parse(swipedData) : [];
      setMatches(loadedMatches);
      setNotifications(loadedNotifs);
      setSwipedIds(loadedSwiped);
      const matchedIds = loadedMatches.map((m) => m.profile.id);
      const remaining = MOCK_PROFILES.filter(
        (p) => !loadedSwiped.includes(p.id) && !matchedIds.includes(p.id)
      );
      setDiscoveryProfiles(remaining);
    } catch {}
  };

  const saveMatches = async (m: Match[]) => {
    await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(m));
  };

  const saveNotifications = async (n: AppNotification[]) => {
    await AsyncStorage.setItem(NOTIFS_KEY, JSON.stringify(n));
  };

  const saveSwiped = async (ids: string[]) => {
    await AsyncStorage.setItem(SWIPED_KEY, JSON.stringify(ids));
  };

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'createdAt'>, currentNotifs: AppNotification[]) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNotif, ...currentNotifs];
    setNotifications(updated);
    await saveNotifications(updated);
    return newNotif;
  };

  const swipeRight = useCallback(async (profile: MockProfile): Promise<{ isMatch: boolean }> => {
    const newSwiped = [...swipedIds, profile.id];
    setSwipedIds(newSwiped);
    await saveSwiped(newSwiped);
    setDiscoveryProfiles((prev) => prev.filter((p) => p.id !== profile.id));

    const isMatch = Math.random() < 0.65;
    if (isMatch) {
      const match: Match = {
        id: `match_${Date.now()}`,
        profile,
        matchedAt: new Date().toISOString(),
        hasNewMessage: false,
      };
      const newMatches = [match, ...matches];
      setMatches(newMatches);
      await saveMatches(newMatches);
      await addNotification(
        { type: 'match', title: "It's a Match!", body: `You and ${profile.name} liked each other`, read: false, relatedId: match.id },
        notifications
      );
      return { isMatch: true };
    }
    return { isMatch: false };
  }, [swipedIds, matches, notifications]);

  const swipeLeft = useCallback(async (profile: MockProfile) => {
    const newSwiped = [...swipedIds, profile.id];
    setSwipedIds(newSwiped);
    await saveSwiped(newSwiped);
    setDiscoveryProfiles((prev) => prev.filter((p) => p.id !== profile.id));
  }, [swipedIds]);

  const superLike = useCallback(async (profile: MockProfile): Promise<{ isMatch: boolean }> => {
    const newSwiped = [...swipedIds, profile.id];
    setSwipedIds(newSwiped);
    await saveSwiped(newSwiped);
    setDiscoveryProfiles((prev) => prev.filter((p) => p.id !== profile.id));

    const isMatch = Math.random() < 0.85;
    if (isMatch) {
      const match: Match = {
        id: `match_${Date.now()}`,
        profile,
        matchedAt: new Date().toISOString(),
        hasNewMessage: false,
      };
      const newMatches = [match, ...matches];
      setMatches(newMatches);
      await saveMatches(newMatches);
      await addNotification(
        { type: 'match', title: "Super Match!", body: `${profile.name} super liked you back!`, read: false, relatedId: match.id },
        notifications
      );
      return { isMatch: true };
    }
    return { isMatch: false };
  }, [swipedIds, matches, notifications]);

  const markNotificationsRead = useCallback(async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    await saveNotifications(updated);
  }, [notifications]);

  const markMatchMessageRead = useCallback(async (matchId: string) => {
    const updated = matches.map((m) => m.id === matchId ? { ...m, hasNewMessage: false } : m);
    setMatches(updated);
    await saveMatches(updated);
  }, [matches]);

  const undoSwipe = useCallback((profile: MockProfile) => {
    setSwipedIds((prev) => prev.filter((id) => id !== profile.id));
    setDiscoveryProfiles((prev) => [profile, ...prev]);
  }, []);

  const reloadProfiles = useCallback(() => {
    const matchedIds = matches.map((m) => m.profile.id);
    const remaining = MOCK_PROFILES.filter(
      (p) => !swipedIds.includes(p.id) && !matchedIds.includes(p.id)
    );
    if (remaining.length === 0) {
      setSwipedIds([]);
      saveSwiped([]);
      setDiscoveryProfiles(MOCK_PROFILES.filter((p) => !matchedIds.includes(p.id)));
    } else {
      setDiscoveryProfiles(remaining);
    }
  }, [swipedIds, matches]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider value={{
      discoveryProfiles,
      matches,
      notifications,
      unreadNotifications,
      swipeRight,
      swipeLeft,
      superLike,
      undoSwipe,
      markNotificationsRead,
      markMatchMessageRead,
      reloadProfiles,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
