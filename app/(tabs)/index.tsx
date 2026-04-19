import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SwipeCard } from '@/components/SwipeCard';
import { MatchPopup } from '@/components/MatchPopup';
import { ProfileDetailModal } from '@/components/ProfileDetailModal';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { Colors } from '@/constants/colors';
import { MockProfile } from '@/data/mockProfiles';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { discoveryProfiles, swipeRight, swipeLeft, superLike, reloadProfiles, undoSwipe, unreadNotifications, matches } = useApp();
  const { spend, coins } = useWallet();

  const [matchProfile, setMatchProfile] = useState<MockProfile | null>(null);
  const [viewProfile, setViewProfile] = useState<MockProfile | null>(null);
  const [lastSwiped, setLastSwiped] = useState<MockProfile | null>(null);
  const [cardContainerHeight, setCardContainerHeight] = useState(0);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const topProfiles = discoveryProfiles.slice(0, 3);

  const handleLike = async () => {
    if (discoveryProfiles.length === 0) return;
    const profile = discoveryProfiles[0];
    setLastSwiped(profile);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { isMatch } = await swipeRight(profile);
    if (isMatch) {
      setMatchProfile(profile);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDislike = async () => {
    if (discoveryProfiles.length === 0) return;
    const profile = discoveryProfiles[0];
    setLastSwiped(profile);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await swipeLeft(profile);
  };

  const handleSuperLike = async () => {
    if (discoveryProfiles.length === 0) return;
    const profile = discoveryProfiles[0];
    if (coins < 10) {
      router.push('/topup');
      return;
    }
    setLastSwiped(profile);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await spend(10, `Super like on ${profile.name}`);
    const { isMatch } = await superLike(profile);
    if (isMatch) {
      setMatchProfile(profile);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleUndo = () => {
    if (!lastSwiped) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    undoSwipe(lastSwiped);
    setLastSwiped(null);
  };

  const handleMatchSendMessage = () => {
    if (matchProfile) {
      const match = matches.find((m) => m.profile.id === matchProfile.id);
      setMatchProfile(null);
      if (match) router.push(`/chat/${match.id}`);
    }
  };

  const onCardContainerLayout = (e: LayoutChangeEvent) => {
    setCardContainerHeight(e.nativeEvent.layout.height);
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Ionicons name="flame" size={26} color={Colors.primary} />
          <Text style={styles.logoText}>Spark</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.foreground} />
            {unreadNotifications > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={styles.headerBtn}>
            <Ionicons name="options-outline" size={22} color={Colors.foreground} />
          </Pressable>
        </View>
      </View>

      {/* Card Stack — takes all remaining space */}
      <View
        style={styles.cardContainer}
        onLayout={onCardContainerLayout}
      >
        {discoveryProfiles.length === 0 ? (
          <EmptyState
            onReload={reloadProfiles}
            onExpandSearch={() => {}}
          />
        ) : cardContainerHeight > 0 ? (
          <>
            {/* Render back-to-front so top card (index 0) is visually on top */}
            {topProfiles.slice(0, 3).slice().reverse().map((profile, reversedI) => {
              // reversedI 0 = back card, last = top card
              const stackIndex = topProfiles.slice(0, 3).length - 1 - reversedI;
              const isTop = stackIndex === 0;
              return (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  isTop={isTop}
                  stackIndex={stackIndex}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onSuperLike={handleSuperLike}
                  onUndo={isTop && lastSwiped ? handleUndo : undefined}
                  onViewProfile={isTop ? () => setViewProfile(profile) : undefined}
                  cardHeight={cardContainerHeight - 4}
                  userInterests={user?.interests}
                />
              );
            })}
          </>
        ) : null}
      </View>

      {matchProfile && (
        <MatchPopup
          profile={matchProfile}
          userPhoto={user?.photos?.[0]}
          onSendMessage={handleMatchSendMessage}
          onClose={() => setMatchProfile(null)}
        />
      )}

      {viewProfile && (
        <ProfileDetailModal
          profile={viewProfile}
          visible={!!viewProfile}
          onClose={() => setViewProfile(null)}
          onLike={() => { setViewProfile(null); handleLike(); }}
          onDislike={() => { setViewProfile(null); handleDislike(); }}
          onSuperLike={() => { setViewProfile(null); handleSuperLike(); }}
        />
      )}
    </View>
  );
}

function EmptyState({ onReload, onExpandSearch }: { onReload: () => void; onExpandSearch: () => void }) {
  return (
    <View style={es.container}>
      <Text style={es.emoji}>😴</Text>
      <Text style={es.title}>You've seen everyone!</Text>
      <Text style={es.sub}>No more profiles nearby. Try reloading or expanding your search radius.</Text>
      <View style={es.btnRow}>
        <Pressable style={es.btnSecondary} onPress={onExpandSearch}>
          <Ionicons name="navigate-outline" size={18} color={Colors.foreground} />
          <Text style={es.btnSecondaryTxt}>Expand Area</Text>
        </Pressable>
        <Pressable style={es.btnPrimary} onPress={onReload}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={es.btnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={es.btnPrimaryTxt}>Reload</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.foreground,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 19,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: Colors.primary,
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'Nunito_700Bold' },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});

const es = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: Colors.foreground, marginBottom: 10, textAlign: 'center' },
  sub: { fontSize: 14, color: Colors.muted, fontFamily: 'Nunito_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btnPrimary: { borderRadius: Colors.radiusFull, overflow: 'hidden' },
  btnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 22, paddingVertical: 13,
  },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontFamily: 'Nunito_700Bold' },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 13,
    backgroundColor: Colors.card, borderRadius: Colors.radiusFull,
    borderWidth: 1, borderColor: Colors.border,
  },
  btnSecondaryTxt: { color: Colors.foreground, fontSize: 15, fontFamily: 'Nunito_700Bold' },
});
