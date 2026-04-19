import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/colors';
import { formatDistanceToNow } from '@/utils/time';

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const { matches } = useApp();

  const newMatches = matches.slice(0, 8);
  const allMatches = matches;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        <Text style={styles.matchCount}>{matches.length} total</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={Colors.muted} />
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptySubtitle}>Start swiping to find your matches!</Text>
          </View>
        ) : (
          <>
            {/* New Matches Horizontal */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>New Matches</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.newMatchesList}
              >
                {newMatches.map((match) => (
                  <Pressable
                    key={match.id}
                    style={styles.newMatchCard}
                    onPress={() => router.push(`/chat/${match.id}`)}
                  >
                    <View style={styles.newMatchImageWrapper}>
                      <Image source={{ uri: match.profile.photos[0] }} style={styles.newMatchImage} />
                      <View style={styles.onlineDot} />
                    </View>
                    <Text style={styles.newMatchName} numberOfLines={1}>
                      {match.profile.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* All Matches List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Matches</Text>
              {allMatches.map((match) => (
                <Pressable
                  key={match.id}
                  style={styles.matchItem}
                  onPress={() => router.push(`/chat/${match.id}`)}
                >
                  <Image source={{ uri: match.profile.photos[0] }} style={styles.matchAvatar} />
                  <View style={styles.matchInfo}>
                    <View style={styles.matchRow}>
                      <Text style={styles.matchName}>{match.profile.name}</Text>
                      <Text style={styles.matchTime}>{formatDistanceToNow(match.matchedAt)}</Text>
                    </View>
                    <Text style={styles.matchDistance}>{match.profile.distance} km away</Text>
                    <View style={styles.interestRow}>
                      {match.profile.interests.slice(0, 2).map((interest) => (
                        <View key={interest} style={styles.interestTag}>
                          <Text style={styles.interestTagText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Pressable
                    style={styles.chatBtn}
                    onPress={() => router.push(`/chat/${match.id}`)}
                  >
                    <Ionicons name="chatbubble" size={20} color={Colors.primary} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </>
        )}
        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.foreground,
  },
  matchCount: {
    fontSize: 14,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
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
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.foreground,
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 8,
  },
  newMatchesList: { paddingHorizontal: 16, gap: 12 },
  newMatchCard: { alignItems: 'center', width: 76 },
  newMatchImageWrapper: { position: 'relative' },
  newMatchImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  newMatchName: {
    fontSize: 12,
    color: Colors.foregroundSecondary,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: 6,
    textAlign: 'center',
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  matchAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  matchInfo: { flex: 1, marginLeft: 14 },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.foreground,
  },
  matchTime: {
    fontSize: 12,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
  },
  matchDistance: {
    fontSize: 13,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  interestRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  interestTag: {
    backgroundColor: Colors.card,
    borderRadius: Colors.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  interestTagText: {
    fontSize: 11,
    color: Colors.muted,
    fontFamily: 'Nunito_600SemiBold',
  },
  chatBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '20',
    borderRadius: 20,
  },
});
