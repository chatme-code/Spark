import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useChat } from '@/context/ChatContext';
import { Colors } from '@/constants/colors';
import { formatDistanceToNow } from '@/utils/time';
import { Match } from '@/context/AppContext';

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const { matches } = useApp();
  const { getLastMessage, getUnreadCount } = useChat();
  const [search, setSearch] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = matches.filter((m) =>
    m.profile.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item: match }: { item: Match }) => {
    const lastMsg = getLastMessage(match.id);
    const unread = getUnreadCount(match.id);

    return (
      <Pressable style={styles.chatItem} onPress={() => router.push(`/chat/${match.id}`)}>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: match.profile.photos[0] }} style={styles.avatar} />
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatRow}>
            <Text style={styles.chatName}>{match.profile.name}</Text>
            <Text style={styles.chatTime}>
              {lastMsg ? formatDistanceToNow(lastMsg.createdAt) : formatDistanceToNow(match.matchedAt)}
            </Text>
          </View>
          <Text style={[styles.lastMessage, unread > 0 && styles.lastMessageUnread]} numberOfLines={1}>
            {lastMsg ? lastMsg.text : `Matched ${formatDistanceToNow(match.matchedAt)}`}
          </Text>
        </View>
        {unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={Colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={Colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={Colors.muted} />
          <Text style={styles.emptyTitle}>
            {matches.length === 0 ? 'No conversations yet' : 'No results'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {matches.length === 0 ? 'Match with someone to start chatting!' : 'Try a different search'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.foreground,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: Colors.foreground,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
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
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  chatInfo: { flex: 1, marginLeft: 12 },
  chatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.foreground,
  },
  chatTime: {
    fontSize: 12,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
  },
  lastMessage: {
    fontSize: 13,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
  },
  lastMessageUnread: {
    color: Colors.foregroundSecondary,
    fontFamily: 'Nunito_600SemiBold',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
  },
});
