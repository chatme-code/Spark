import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
  Image,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { MockProfile } from '@/data/mockProfiles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const INTEREST_ICONS: Record<string, string> = {
  Yoga: '🧘', Coffee: '☕', Travel: '✈️', Photography: '📷', Art: '🎨',
  Reading: '📚', Cooking: '👨‍🍳', Hiking: '🥾', Dogs: '🐕', Nature: '🌿',
  Music: '🎵', Guitar: '🎸', Jazz: '🎷', Dancing: '💃', Fitness: '💪',
  Gaming: '🎮', Movies: '🎬', Wine: '🍷', Food: '🍜', Cats: '🐱',
  Running: '🏃', Cycling: '🚴', Swimming: '🏊', Surfing: '🏄', Tennis: '🎾',
  Football: '⚽', Basketball: '🏀', Yoga2: '🧘', Meditation: '🧘',
  Cooking2: '🍳', Baking: '🥐', Restaurant: '🍽️', Climbing: '🧗',
  Skiing: '⛷️', Camping: '⛺', Beach: '🏖️', Fashion: '👗', Tech: '💻',
};

function getIcon(interest: string): string {
  return INTEREST_ICONS[interest] ?? '✨';
}

interface Props {
  profile: MockProfile;
  visible: boolean;
  onClose: () => void;
  onLike: () => void;
  onDislike: () => void;
  onSuperLike: () => void;
}

export function ProfileDetailModal({
  profile,
  visible,
  onClose,
  onLike,
  onDislike,
  onSuperLike,
}: Props) {
  const insets = useSafeAreaInsets();
  const [photoIndex, setPhotoIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setPhotoIndex(0);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 20,
        tension: 180,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleLike = () => { onClose(); setTimeout(onLike, 150); };
  const handleDislike = () => { onClose(); setTimeout(onDislike, 150); };
  const handleSuperLike = () => { onClose(); setTimeout(onSuperLike, 150); };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* ── Photo carousel ────────────────────────────────── */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: profile.photos[photoIndex] }}
              style={styles.photo}
              resizeMode="cover"
            />

            {/* Gradient top */}
            <LinearGradient
              colors={['rgba(0,0,0,0.45)', 'transparent']}
              style={styles.topGrad}
              pointerEvents="none"
            />

            {/* Gradient bottom */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.bottomGrad}
              pointerEvents="none"
            />

            {/* Photo nav taps */}
            <View style={[StyleSheet.absoluteFill, styles.photoNav]} pointerEvents="box-none">
              <Pressable
                style={{ flex: 1 }}
                onPress={() => setPhotoIndex((p) => Math.max(0, p - 1))}
              />
              <Pressable
                style={{ flex: 1 }}
                onPress={() => setPhotoIndex((p) => Math.min(profile.photos.length - 1, p + 1))}
              />
            </View>

            {/* Dots */}
            <View style={styles.photoDots}>
              {profile.photos.map((_, i) => (
                <Pressable key={i} onPress={() => setPhotoIndex(i)}>
                  <View style={[styles.dot, i === photoIndex && styles.dotActive]} />
                </Pressable>
              ))}
            </View>

            {/* Close button */}
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <Ionicons name="chevron-down" size={22} color="#fff" />
            </Pressable>

            {/* Photo count */}
            <View style={styles.photoCount}>
              <Text style={styles.photoCountTxt}>{photoIndex + 1}/{profile.photos.length}</Text>
            </View>

            {/* Name + age overlay */}
            <View style={styles.nameOverlay}>
              <View style={styles.nameRow}>
                {profile.verified && (
                  <Ionicons name="checkmark-circle" size={22} color="#4FC3F7" style={{ marginRight: 6 }} />
                )}
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.age}>, {profile.age}</Text>
              </View>
              <View style={styles.metaRow}>
                {profile.job ? (
                  <View style={styles.metaChip}>
                    <Ionicons name="briefcase-outline" size={13} color="rgba(255,255,255,0.75)" />
                    <Text style={styles.metaTxt}>{profile.job}</Text>
                  </View>
                ) : null}
                <View style={styles.metaChip}>
                  <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.metaTxt}>{profile.distance} km away</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Scrollable content ─────────────────────────────── */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Education */}
            {profile.education ? (
              <View style={styles.infoRow}>
                <Ionicons name="school-outline" size={18} color={Colors.muted} />
                <Text style={styles.infoTxt}>{profile.education}</Text>
              </View>
            ) : null}

            {/* Bio */}
            {profile.bio ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>About</Text>
                <Text style={styles.bioTxt}>{profile.bio}</Text>
              </View>
            ) : null}

            {/* Interests */}
            {profile.interests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Interests</Text>
                <View style={styles.interestGrid}>
                  {profile.interests.map((interest) => (
                    <View key={interest} style={styles.interestChip}>
                      <Text style={styles.interestIcon}>{getIcon(interest)}</Text>
                      <Text style={styles.interestTxt}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Basics */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Basics</Text>
              <View style={styles.basicsGrid}>
                <View style={styles.basicChip}>
                  <Ionicons name="person-outline" size={15} color={Colors.muted} />
                  <Text style={styles.basicTxt}>Age {profile.age}</Text>
                </View>
                <View style={styles.basicChip}>
                  <Ionicons name="navigate-outline" size={15} color={Colors.muted} />
                  <Text style={styles.basicTxt}>{profile.distance} km away</Text>
                </View>
                {profile.verified && (
                  <View style={styles.basicChip}>
                    <Ionicons name="shield-checkmark-outline" size={15} color="#4FC3F7" />
                    <Text style={[styles.basicTxt, { color: '#4FC3F7' }]}>Verified</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Report link */}
            <Pressable style={styles.reportRow}>
              <Ionicons name="flag-outline" size={14} color={Colors.muted} />
              <Text style={styles.reportTxt}>Report {profile.name}</Text>
            </Pressable>
          </ScrollView>

          {/* ── Fixed action buttons ───────────────────────────── */}
          <View style={[styles.actionsBar, { paddingBottom: insets.bottom + 12 }]}>
            {/* Dislike */}
            <Pressable
              style={[styles.actionBtn, styles.dislikeBtn]}
              onPress={handleDislike}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </Pressable>

            {/* Super like */}
            <Pressable
              style={[styles.actionBtn, styles.superBtn]}
              onPress={handleSuperLike}
            >
              <Ionicons name="star" size={22} color="#fff" />
              <Text style={styles.superCostTxt}>10🪙</Text>
            </Pressable>

            {/* Like */}
            <Pressable
              style={[styles.actionBtn, styles.likeBtn]}
              onPress={handleLike}
            >
              <Ionicons name="heart" size={30} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.52;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.93,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  photoContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    position: 'relative',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  topGrad: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 100,
    zIndex: 2,
  },
  bottomGrad: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 160,
    zIndex: 2,
  },
  photoNav: {
    flexDirection: 'row',
    zIndex: 3,
  },
  photoDots: {
    position: 'absolute',
    top: 14,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    zIndex: 5,
  },
  dot: {
    width: 24, height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: '#fff' },
  closeBtn: {
    position: 'absolute',
    top: 12, left: 16,
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 6,
  },
  photoCount: {
    position: 'absolute',
    top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
    zIndex: 6,
  },
  photoCountTxt: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 18, left: 18, right: 18,
    zIndex: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
  },
  age: {
    fontSize: 26,
    fontFamily: 'Nunito_400Regular',
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaTxt: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
  },

  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTxt: {
    color: Colors.foreground,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },

  section: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  bioTxt: {
    fontSize: 15,
    color: Colors.foreground,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 23,
  },

  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  interestIcon: { fontSize: 15 },
  interestTxt: {
    color: Colors.foreground,
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },

  basicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  basicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  basicTxt: {
    color: Colors.foregroundSecondary,
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
  },

  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  reportTxt: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
  },

  actionsBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  dislikeBtn: {
    width: 60, height: 60,
    backgroundColor: 'rgba(80,80,84,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  superBtn: {
    width: 52, height: 52,
    backgroundColor: 'rgba(59,130,246,0.9)',
    gap: 1,
  },
  superCostTxt: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
  },
  likeBtn: {
    width: 68, height: 68,
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
});
