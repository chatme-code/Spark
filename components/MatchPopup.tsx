import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { MockProfile } from '@/data/mockProfiles';

const { width, height } = Dimensions.get('window');

const HEARTS = ['❤️', '💕', '💗', '💖', '🔥', '✨', '💓'];

function FloatingHeart({ delay, x }: { delay: number; x: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(anim, { toValue: -height * 0.6, duration: 2800, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }, delay);
  }, []);

  const emoji = HEARTS[Math.floor(x * HEARTS.length) % HEARTS.length];

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        bottom: height * 0.12,
        left: x * width,
        fontSize: 22 + (x * 14),
        opacity: opacityAnim,
        transform: [{ translateY: anim }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

interface MatchPopupProps {
  profile: MockProfile;
  onSendMessage: () => void;
  onClose: () => void;
  userPhoto?: string;
}

export function MatchPopup({ profile, onSendMessage, onClose, userPhoto }: MatchPopupProps) {
  const titleScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const photosAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(titleScale, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.spring(photosAnim, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.spring(buttonsAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ring1, { toValue: 1.18, duration: 1100, useNativeDriver: true }),
        Animated.timing(ring1, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ring2, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(ring2, { toValue: 1.22, duration: 1300, useNativeDriver: true }),
        Animated.timing(ring2, { toValue: 1, duration: 550, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatPositions = [0.05, 0.18, 0.35, 0.52, 0.67, 0.82, 0.92];
  const floatDelays = [0, 400, 800, 200, 600, 100, 700];

  return (
    <Modal transparent animationType="fade">
      <View style={styles.root}>
        {/* Background gradient */}
        <LinearGradient
          colors={['#1a0015', '#0d0010', '#000']}
          style={StyleSheet.absoluteFill}
        />

        {/* Floating hearts */}
        {floatPositions.map((x, i) => (
          <FloatingHeart key={i} delay={floatDelays[i]} x={x} />
        ))}

        {/* Title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ scale: titleScale }],
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <Animated.Text style={[styles.fireEmoji, { transform: [{ scale: glowAnim }] }]}>
            🔥
          </Animated.Text>
          <Text style={styles.itsAMatch}>It's a Match!</Text>
          <Text style={styles.subtitle}>You and {profile.name} liked each other</Text>
        </Animated.View>

        {/* Photos */}
        <Animated.View
          style={[
            styles.photosRow,
            {
              opacity: photosAnim,
              transform: [{ scale: photosAnim }],
            },
          ]}
        >
          {/* User photo */}
          <View style={styles.photoOuter}>
            <Animated.View
              style={[
                styles.photoRing,
                { borderColor: Colors.primary, transform: [{ scale: ring1 }] },
              ]}
            />
            <Image
              source={{ uri: userPhoto ?? `https://picsum.photos/seed/myprofile/200/200` }}
              style={styles.photo}
            />
          </View>

          {/* Heart center */}
          <Animated.View style={[styles.heartCenter, { transform: [{ scale: glowAnim }] }]}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.heartGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="heart" size={28} color="#fff" />
            </LinearGradient>
          </Animated.View>

          {/* Match photo */}
          <View style={styles.photoOuter}>
            <Animated.View
              style={[
                styles.photoRing,
                { borderColor: Colors.secondary, transform: [{ scale: ring2 }] },
              ]}
            />
            <Image
              source={{ uri: profile.photos[0] }}
              style={styles.photo}
            />
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttons,
            {
              opacity: buttonsAnim,
              transform: [{ translateY: buttonsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            },
          ]}
        >
          <Pressable style={styles.messageButton} onPress={onSendMessage}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.messageGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="chatbubble" size={20} color="#fff" />
              <Text style={styles.messageTxt}>Send Message 💬</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.keepButton} onPress={onClose}>
            <Text style={styles.keepTxt}>Keep Swiping</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const PHOTO_SIZE = 128;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fireEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  itsAMatch: {
    fontSize: 46,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.foregroundSecondary,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginTop: 6,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 40,
    gap: 0,
  },
  photoOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: PHOTO_SIZE + 20,
    height: PHOTO_SIZE + 20,
  },
  photoRing: {
    position: 'absolute',
    width: PHOTO_SIZE + 14,
    height: PHOTO_SIZE + 14,
    borderRadius: (PHOTO_SIZE + 14) / 2,
    borderWidth: 3,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
  },
  heartCenter: {
    width: 52,
    height: 52,
    zIndex: 10,
    marginHorizontal: -6,
  },
  heartGrad: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },
  buttons: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  messageButton: {
    width: '100%',
    borderRadius: Colors.radiusFull,
    overflow: 'hidden',
  },
  messageGrad: {
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  messageTxt: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
  },
  keepButton: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  keepTxt: {
    color: Colors.muted,
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
  },
});
