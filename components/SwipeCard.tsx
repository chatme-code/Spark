import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { MockProfile } from '@/data/mockProfiles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.26;

function getMatchReason(profile: MockProfile, userInterests?: string[]): string {
  if (userInterests && userInterests.length > 0) {
    const shared = profile.interests.filter((i) => userInterests.includes(i));
    if (shared.length > 0) return `You both like ${shared[0]} ✨`;
  }
  const seed = profile.id.charCodeAt(profile.id.length - 1);
  const pct = 65 + (seed % 30);
  return `🔥 ${pct}% match`;
}

interface SwipeCardProps {
  profile: MockProfile;
  onLike: () => void;
  onDislike: () => void;
  onSuperLike: () => void;
  onUndo?: () => void;
  onViewProfile?: () => void;
  isTop: boolean;
  stackIndex: number;
  cardHeight: number;
  userInterests?: string[];
}

export function SwipeCard({
  profile,
  onLike,
  onDislike,
  onSuperLike,
  onUndo,
  onViewProfile,
  isTop,
  stackIndex,
  cardHeight,
  userInterests,
}: SwipeCardProps) {
  const CARD_WIDTH = SCREEN_WIDTH - 20;

  // Swipe position (only animates for top card)
  const position = useRef(new Animated.ValueXY()).current;

  // ── STACK EFFECT (static values for non-top cards) ──────────────────
  // stackIndex 0 = top, 1 = middle, 2 = back
  const stackScale = 1 - stackIndex * 0.035;
  const stackTranslateY = stackIndex * 12;

  // ── SWIPE OVERLAYS ────────────────────────────────────────────────────
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.18],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const likeTint = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.32],
    outputRange: ['rgba(52,199,89,0)', 'rgba(52,199,89,0.18)'],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.18, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const nopeTint = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.32, 0],
    outputRange: ['rgba(255,68,88,0.18)', 'rgba(255,68,88,0)'],
    extrapolate: 'clamp',
  });
  const superlikeOpacity = position.y.interpolate({
    inputRange: [-SCREEN_HEIGHT * 0.15, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // ── ROTATION (only meaningful when isTop) ────────────────────────────
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  // ── BUTTON BOUNCE SCALES ──────────────────────────────────────────────
  const likeScale = useRef(new Animated.Value(1)).current;
  const dislikeScale = useRef(new Animated.Value(1)).current;
  const superScale = useRef(new Animated.Value(1)).current;

  const [photoIndex, setPhotoIndex] = useState(0);
  const lastTapRef = useRef(0);

  const bounceBtn = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.8, useNativeDriver: true, speed: 60, bounciness: 8 }),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 14 }),
    ]).start();
  };

  // ── PAN RESPONDER ─────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onMoveShouldSetPanResponder: (_, g) =>
        isTop && (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5),
      onPanResponderMove: (_, g) => {
        position.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        // Tap detection: negligible movement = open profile
        const isTap = Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8;
        if (isTap) {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
            tension: 65,
          }).start();
          onViewProfile?.();
          return;
        }

        if (g.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH + 200, y: g.dy + g.vy * 80 },
            duration: 220,
            useNativeDriver: false,
          }).start(() => onLike());
        } else if (g.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH - 200, y: g.dy + g.vy * 80 },
            duration: 220,
            useNativeDriver: false,
          }).start(() => onDislike());
        } else if (g.dy < -SWIPE_THRESHOLD * 0.7) {
          Animated.timing(position, {
            toValue: { x: g.dx, y: -SCREEN_HEIGHT - 200 },
            duration: 220,
            useNativeDriver: false,
          }).start(() => onSuperLike());
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
            tension: 65,
          }).start();
        }
      },
    })
  ).current;

  const handlePhotoTap = (side: 'left' | 'right') => {
    const now = Date.now();
    if (now - lastTapRef.current < 300 && side === 'right') {
      onLike();
      return;
    }
    lastTapRef.current = now;
    if (side === 'right') setPhotoIndex((p) => Math.min(profile.photos.length - 1, p + 1));
    else setPhotoIndex((p) => Math.max(0, p - 1));
  };

  const matchReason = getMatchReason(profile, userInterests);

  // ── COMBINE ALL TRANSFORMS INTO ONE ARRAY ────────────────────────────
  // This is CRITICAL — merging transform arrays in style[] causes override.
  // We must build one single transform array so swipe + stack both apply.
  const animatedTransform = isTop
    ? [
        { translateX: position.x },
        { translateY: position.y },
        { translateY: stackTranslateY },
        { rotate: rotation },
        { scale: stackScale },
      ]
    : [
        { translateX: 0 },
        { translateY: stackTranslateY },
        { scale: stackScale },
      ];

  return (
    <Animated.View
      style={[
        styles.card,
        {
          width: CARD_WIDTH,
          height: cardHeight,
          transform: animatedTransform as any,
        },
      ]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      {/* Photo */}
      <Image
        source={{ uri: profile.photos[photoIndex] }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Swipe color tints */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: likeTint }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: nopeTint }]}
        pointerEvents="none"
      />

      {/* Photo dots */}
      {profile.photos.length > 1 && (
        <View style={styles.photoDots}>
          {profile.photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
          ))}
        </View>
      )}

      {/* Photo tap zones — only on top card */}
      {isTop && (
        <View style={[StyleSheet.absoluteFill, styles.photoNav]} pointerEvents="box-none">
          <Pressable style={{ flex: 1 }} onPress={() => handlePhotoTap('left')} />
          <Pressable style={{ flex: 1 }} onPress={() => handlePhotoTap('right')} />
        </View>
      )}

      {/* LIKE label */}
      <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]} pointerEvents="none">
        <Ionicons name="heart" size={24} color={Colors.success} />
        <Text style={styles.likeLabelText}>LIKE</Text>
      </Animated.View>

      {/* NOPE label */}
      <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]} pointerEvents="none">
        <Ionicons name="close" size={24} color={Colors.primary} />
        <Text style={styles.nopeLabelText}>NOPE</Text>
      </Animated.View>

      {/* SUPER label */}
      <Animated.View style={[styles.superLabel, { opacity: superlikeOpacity }]} pointerEvents="none">
        <Ionicons name="star" size={20} color={Colors.superlike} />
        <Text style={styles.superLabelText}>SUPER LIKE</Text>
      </Animated.View>

      {/* Match reason badge */}
      <View style={styles.matchBadge}>
        <Text style={styles.matchBadgeTxt}>{matchReason}</Text>
      </View>

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.94)']}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Card info + buttons */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          {profile.verified && (
            <Ionicons name="checkmark-circle" size={20} color="#4FC3F7" style={{ marginRight: 5 }} />
          )}
          <Text style={styles.name}>{profile.name}, {profile.age}</Text>
        </View>

        <View style={styles.metaRow}>
          {profile.job ? (
            <View style={styles.metaChip}>
              <Ionicons name="briefcase-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaTxt}>{profile.job}</Text>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.metaTxt}>{profile.distance} km away</Text>
          </View>
        </View>

        {profile.bio ? (
          <Text style={styles.bio} numberOfLines={1}>{profile.bio}</Text>
        ) : null}

        {profile.interests.length > 0 && (
          <View style={styles.interests}>
            {profile.interests.slice(0, 3).map((interest) => (
              <View key={interest} style={styles.interestChip}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons — only on top card */}
        {isTop && (
          <View style={styles.actions}>
            {onUndo ? (
              <Pressable
                style={styles.undoBtn}
                onPress={() => { bounceBtn(dislikeScale); onUndo(); }}
                hitSlop={8}
              >
                <Ionicons name="arrow-undo" size={18} color={Colors.gold} />
              </Pressable>
            ) : (
              <View style={{ width: 38 }} />
            )}

            <Animated.View style={{ transform: [{ scale: dislikeScale }] }}>
              <Pressable
                style={[styles.actionBtn, styles.dislikeBtn]}
                onPress={() => { bounceBtn(dislikeScale); onDislike(); }}
                hitSlop={6}
              >
                <Ionicons name="close" size={32} color="#fff" />
              </Pressable>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: superScale }] }}>
              <Pressable
                style={[styles.actionBtn, styles.superBtn]}
                onPress={() => { bounceBtn(superScale); onSuperLike(); }}
                hitSlop={6}
              >
                <Ionicons name="star" size={22} color="#fff" />
                <Text style={styles.superCostTxt}>10</Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Pressable
                style={[styles.actionBtn, styles.likeBtn]}
                onPress={() => { bounceBtn(likeScale); onLike(); }}
                hitSlop={6}
              >
                <Ionicons name="heart" size={32} color="#fff" />
              </Pressable>
            </Animated.View>

            <Pressable style={styles.moreBtn} hitSlop={8} onPress={() => onViewProfile?.()}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.muted} />
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: {
        boxShadow: '0px 8px 32px rgba(0,0,0,0.45)',
      },
    }),
  },

  photoDots: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    zIndex: 3,
  },
  dot: {
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: { backgroundColor: '#fff' },

  photoNav: {
    flexDirection: 'row',
    zIndex: 2,
  },

  likeLabel: {
    position: 'absolute',
    top: 42,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 3,
    borderColor: Colors.success,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    transform: [{ rotate: '-18deg' }],
    backgroundColor: 'rgba(52,199,89,0.15)',
    zIndex: 10,
  },
  likeLabelText: {
    color: Colors.success,
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 2,
  },

  nopeLabel: {
    position: 'absolute',
    top: 42,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 3,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    transform: [{ rotate: '18deg' }],
    backgroundColor: 'rgba(255,68,88,0.15)',
    zIndex: 10,
  },
  nopeLabelText: {
    color: Colors.primary,
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 2,
  },

  superLabel: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 3,
    borderColor: Colors.superlike,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: 'rgba(59,130,246,0.18)',
    zIndex: 10,
  },
  superLabelText: {
    color: Colors.superlike,
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 2,
  },

  matchBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.58)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 5,
  },
  matchBadgeTxt: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
  },

  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '58%',
    zIndex: 1,
  },

  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 14,
    zIndex: 2,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTxt: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Nunito_400Regular',
  },
  bio: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 8,
    lineHeight: 18,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  interestChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  interestText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  dislikeBtn: {
    width: 58,
    height: 58,
    backgroundColor: 'rgba(80,80,84,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  superBtn: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(59,130,246,0.88)',
  },
  superCostTxt: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
    marginTop: -2,
  },
  likeBtn: {
    width: 68,
    height: 68,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
      web: { boxShadow: `0 0 18px ${Colors.primary}99` },
    }),
  },
  undoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5,
    borderColor: Colors.gold + '70',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
