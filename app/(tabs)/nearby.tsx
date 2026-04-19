import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { MOCK_PROFILES, MockProfile } from '@/data/mockProfiles';

type FilterKey = 'Semua' | 'Online' | 'Terverifikasi' | 'Baru';

const FILTERS: { key: FilterKey; label: string; icon?: string }[] = [
  { key: 'Semua', label: 'Semua' },
  { key: 'Online', label: 'Online', icon: 'radio-button-on' },
  { key: 'Terverifikasi', label: 'Verified', icon: 'checkmark-circle' },
  { key: 'Baru', label: 'New', icon: 'sparkles' },
];

const ONLINE_IDS = new Set(['p1', 'p3', 'p5', 'p7']);
const NEW_IDS = new Set(['p4', 'p6', 'p8']);

function getDistanceLabel(km: number): string {
  if (km < 1) return 'Very close 🔥';
  if (km === 1) return '1 km • Nearby now';
  if (km <= 3) return `${km} km • Super close`;
  if (km <= 7) return `${km} km • Nearby`;
  return `${km} km away`;
}

function getMatchPercent(profile: MockProfile): number {
  const seed = profile.id.charCodeAt(profile.id.length - 1);
  return 65 + (seed % 30);
}

function getMatchColor(pct: number): string {
  if (pct >= 85) return '#FF4458';
  if (pct >= 75) return '#FF9F0A';
  return '#34C759';
}

export default function NearbyScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Semua');

  const CARD_W = Math.floor((width - 24 - 10) / 2);

  const sorted = [...MOCK_PROFILES].sort((a, b) => a.distance - b.distance);

  const filtered = sorted.filter((p) => {
    if (activeFilter === 'Online') return ONLINE_IDS.has(p.id);
    if (activeFilter === 'Terverifikasi') return p.verified;
    if (activeFilter === 'Baru') return NEW_IDS.has(p.id);
    return true;
  });

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Nearby</Text>
          <Text style={s.headerSub}>{filtered.length} orang di sekitarmu</Text>
        </View>
        <View style={s.headerRight}>
          <Ionicons name="location" size={14} color={Colors.primary} />
          <Text style={s.headerLoc}>Jakarta</Text>
        </View>
      </View>

      {/* Filter chips — replaced search bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersRow}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <Pressable
              key={f.key}
              style={[s.filterChip, active && s.filterChipActive]}
              onPress={() => {
                setActiveFilter(f.key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              {f.icon && (
                <Ionicons
                  name={f.icon as any}
                  size={13}
                  color={active ? '#fff' : f.key === 'Online' ? Colors.success : Colors.muted}
                />
              )}
              <Text style={[s.filterChipTxt, active && s.filterChipTxtActive]}>{f.label}</Text>
              {f.key === 'Online' && !active && (
                <View style={s.onlineDotFilter} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 2-Column Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 90 }]}
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="location-outline" size={48} color={Colors.muted} />
            <Text style={s.emptyTitle}>Tidak ada hasil</Text>
            <Text style={s.emptyDesc}>Coba ubah filter atau perluas radius pencarian</Text>
          </View>
        ) : (
          <View style={s.gridRow}>
            {filtered.map((profile, index) => (
              <NearbyCard
                key={profile.id}
                profile={profile}
                cardWidth={CARD_W}
                isOnline={ONLINE_IDS.has(profile.id)}
                isNew={NEW_IDS.has(profile.id)}
                index={index}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function NearbyCard({
  profile,
  cardWidth,
  isOnline,
  isNew,
  index,
}: {
  profile: MockProfile;
  cardWidth: number;
  isOnline: boolean;
  isNew: boolean;
  index: number;
}) {
  const [liked, setLiked] = useState(false);
  const likeScale = useRef(new Animated.Value(1)).current;
  const heartBurst = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const lastTapRef = useRef(0);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const triggerLike = useCallback((wasLiked: boolean) => {
    const next = !wasLiked;
    setLiked(next);
    Haptics.impactAsync(next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.4, useNativeDriver: true, speed: 60, bounciness: 18 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();

    if (next) {
      heartBurst.setValue(0);
      Animated.timing(heartBurst, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, []);

  const handleLikePress = () => triggerLike(liked);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (!liked) triggerLike(false);
    }
    lastTapRef.current = now;
  };

  const matchPct = getMatchPercent(profile);
  const matchColor = getMatchColor(matchPct);
  const distLabel = getDistanceLabel(profile.distance);
  const shortBio = profile.bio ? profile.bio.split('|')[0].trim() : '';
  const tags = profile.interests.slice(0, 2);
  const cardHeight = Math.floor(cardWidth * 1.52);

  const heartOpacity = heartBurst.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 1, 1, 0] });
  const heartScale = heartBurst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.3, 1.2, 1.6] });

  return (
    <Animated.View
      style={[
        c.card,
        { width: cardWidth, height: cardHeight },
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Pressable onPress={handleDoubleTap} style={{ flex: 1 }}>
        <Image source={{ uri: profile.photos[0] }} style={c.photo} />

        {/* Match % — top left (includes NEW label if new user) */}
        <View style={[c.matchBadge, { backgroundColor: matchColor + 'EE' }]}>
          <Text style={c.matchTxt}>{isNew ? '✨ NEW' : `🔥 ${matchPct}%`}</Text>
        </View>

        {/* Like button — top right, bigger */}
        <Pressable
          style={[c.likeBtn, liked && c.likeBtnActive]}
          onPress={handleLikePress}
          hitSlop={8}
        >
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={22}
              color={liked ? '#fff' : 'rgba(255,255,255,0.9)'}
            />
          </Animated.View>
        </Pressable>

        {/* Heart burst overlay */}
        <Animated.View
          style={[
            c.heartBurst,
            { opacity: heartOpacity, transform: [{ scale: heartScale }], pointerEvents: 'none' },
          ]}
        >
          <Ionicons name="heart" size={64} color={Colors.primary} />
        </Animated.View>

        {/* Gradient + info */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.92)']}
          style={c.grad}
        >
          {/* Distance */}
          <View style={c.distRow}>
            <Ionicons name="location" size={10} color="rgba(255,255,255,0.7)" />
            <Text style={c.distText}>{distLabel}</Text>
          </View>

          {/* Name + verified + online inline */}
          <View style={c.nameRow}>
            {profile.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#4FC3F7" style={{ marginRight: 3 }} />
            )}
            <Text style={c.name} numberOfLines={1}>
              {profile.name}, {profile.age}
            </Text>
            {isOnline && <View style={c.onlineDotName} />}
          </View>

          {/* Short bio */}
          {shortBio ? (
            <Text style={c.bio} numberOfLines={1}>{shortBio}</Text>
          ) : null}

          {/* Interest tags */}
          {tags.length > 0 && (
            <View style={c.tagsRow}>
              {tags.map((t) => (
                <View key={t} style={c.tag}>
                  <Text style={c.tagTxt}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: Colors.foreground },
  headerSub: { fontSize: 13, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginTop: 2 },
  headerRight: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.primary + '40',
    marginTop: 4,
  },
  headerLoc: { color: Colors.primary, fontSize: 13, fontFamily: 'Nunito_700Bold' },

  filtersRow: { paddingHorizontal: 12, gap: 8, paddingBottom: 10 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipTxt: { color: Colors.muted, fontSize: 13, fontFamily: 'Nunito_700Bold' },
  filterChipTxtActive: { color: '#fff' },
  onlineDotFilter: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success,
  },

  grid: { paddingHorizontal: 12, paddingTop: 4 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.foreground },
  emptyDesc: { fontSize: 13, color: Colors.muted, fontFamily: 'Nunito_400Regular', textAlign: 'center' },
});

const c = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  photo: { width: '100%', height: '100%', position: 'absolute' },

  onlineDotName: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.success,
    marginLeft: 5,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.4)',
  },

  matchBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10,
  },
  matchTxt: { color: '#fff', fontSize: 11, fontFamily: 'Nunito_800ExtraBold' },

  likeBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  likeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },

  heartBurst: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },

  grad: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10, paddingBottom: 10, paddingTop: 36,
  },

  distRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  distText: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontFamily: 'Nunito_600SemiBold' },

  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  name: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_800ExtraBold', flexShrink: 1 },

  bio: {
    color: 'rgba(255,255,255,0.65)', fontSize: 10,
    fontFamily: 'Nunito_400Regular', marginBottom: 5,
  },

  tagsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 7, paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  tagTxt: { color: 'rgba(255,255,255,0.9)', fontSize: 9, fontFamily: 'Nunito_700Bold' },
});
