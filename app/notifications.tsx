import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp, AppNotification } from '@/context/AppContext';
import { Colors } from '@/constants/colors';
import { formatDistanceToNow } from '@/utils/time';

const NOTIF_CONFIG: Record<AppNotification['type'], { icon: string; color: string; bg: string }> = {
  match: { icon: 'heart', color: Colors.primary, bg: Colors.primary + '20' },
  message: { icon: 'chatbubble', color: Colors.secondary, bg: Colors.secondary + '20' },
  like: { icon: 'star', color: Colors.superlike, bg: Colors.superlike + '20' },
  system: { icon: 'information-circle', color: Colors.muted, bg: Colors.muted + '20' },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationsRead, matches } = useApp();

  useEffect(() => {
    markNotificationsRead();
  }, []);

  const renderNotif = ({ item }: { item: AppNotification }) => {
    const cfg = NOTIF_CONFIG[item.type];
    const match = item.relatedId ? matches.find((m) => m.id === item.relatedId) : null;

    return (
      <Pressable
        style={[styles.notifItem, !item.read && styles.notifItemUnread]}
        onPress={() => {
          if (item.type === 'match' && match) {
            router.push(`/chat/${match.id}`);
          }
        }}
      >
        <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
          {match ? (
            <Image source={{ uri: match.profile.photos[0] }} style={styles.matchPhoto} />
          ) : (
            <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
          )}
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.notifTime}>{formatDistanceToNow(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={64} color={Colors.muted} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>You'll be notified when you get matches and messages</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotif}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: Colors.foreground },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notifItemUnread: { backgroundColor: Colors.primary + '08' },
  notifIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  matchPhoto: { width: 48, height: 48, borderRadius: 24 },
  notifContent: { flex: 1 },
  notifTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: Colors.foreground,
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 13,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
});
