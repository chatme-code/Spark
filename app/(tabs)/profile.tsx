import React, { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useWallet, Transaction } from '@/context/WalletContext';
import { Colors } from '@/constants/colors';

const ONLINE = true;

function useCountUp(target: number, duration = 1000) {
  const [display, setDisplay] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animVal.setValue(0);
    Animated.timing(animVal, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();

    const id = animVal.addListener(({ value }) => {
      setDisplay(Math.round(value));
    });
    return () => animVal.removeListener(id);
  }, [target]);

  return display;
}

function StatItem({ value, label, goldValue }: { value: number; label: string; goldValue?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 30 }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} style={styles.statItem}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <Text style={[styles.statNum, goldValue && { color: Colors.gold }]}>{value.toLocaleString()}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function computeProgress(user: any): number {
  let score = 0;
  if (user?.name?.trim()) score += 10;
  if (user?.age >= 18) score += 10;
  if (user?.gender) score += 10;
  if ((user?.photos?.length ?? 0) >= 2) score += 15;
  if ((user?.bio?.trim()?.length ?? 0) >= 20) score += 15;
  if ((user?.interests?.length ?? 0) >= 3) score += 15;
  if (user?.location?.trim()) score += 10;
  const ls = user?.lifestyle ?? {};
  if (Object.values(ls).some(Boolean)) score += 15;
  return score;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { matches } = useApp();
  const { coins, transactions } = useWallet();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const animatedCoins = useCountUp(coins);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  };

  if (!user) return null;

  const photos = user.photos?.length > 0 ? user.photos : [`https://picsum.photos/seed/${user.id}/400/600`];
  const progress = computeProgress(user);
  const progressColor = progress >= 80 ? Colors.success : progress >= 50 ? Colors.gold : Colors.primary;

  const lifestyleItems = [
    user.lifestyle?.smoking && { icon: 'ban-outline', label: `Smoking: ${user.lifestyle.smoking}` },
    user.lifestyle?.drinking && { icon: 'wine-outline', label: `Drinking: ${user.lifestyle.drinking}` },
    user.lifestyle?.workout && { icon: 'barbell-outline', label: `Workout: ${user.lifestyle.workout}` },
    user.lifestyle?.education && { icon: 'school-outline', label: `${user.lifestyle.education}` },
  ].filter(Boolean) as { icon: string; label: string }[];

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          onPress={() => router.push('/edit-profile')}
          style={styles.editBtn}
        >
          <Ionicons name="create-outline" size={20} color={Colors.primary} />
          <Text style={styles.editBtnTxt}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>

        {/* Profile Completion Banner */}
        {progress < 100 && (
          <Pressable style={styles.completionBanner} onPress={() => router.push('/edit-profile')}>
            <View style={styles.completionLeft}>
              <Text style={styles.completionTitle}>Profile {progress}% complete</Text>
              <Text style={styles.completionSub}>Complete your profile to get more matches</Text>
              <View style={styles.completionTrack}>
                <View style={[styles.completionFill, { width: `${progress}%` as any, backgroundColor: progressColor }]} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={progressColor} />
          </Pressable>
        )}

        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.mainPhotoWrapper}>
            <View style={styles.avatarGlowOuter}>
              <LinearGradient
                colors={['#FF4458', '#7C5CFC']}
                style={styles.avatarGlowRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatarInner}>
                  <Image source={{ uri: photos[0] }} style={styles.mainPhoto} />
                </View>
              </LinearGradient>
            </View>
            <View style={[styles.statusDot, { backgroundColor: ONLINE ? Colors.success : Colors.muted }]}>
              <View style={[styles.statusDotInner, { backgroundColor: ONLINE ? Colors.success : Colors.muted }]} />
            </View>
          </View>

          {photos.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.morePhotos}>
              {photos.slice(1).map((photo, i) => (
                <Image key={i} source={{ uri: photo }} style={styles.extraPhoto} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Name & Info */}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.age}>{user.age}</Text>
            {user.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={22} color="#1877F2" />
              </View>
            )}
          </View>
          {user.verified && (
            <View style={styles.verifiedLabelRow}>
              <Ionicons name="shield-checkmark" size={13} color="#1877F2" />
              <Text style={styles.verifiedLabel}>Terverifikasi</Text>
            </View>
          )}
          {user.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.muted} />
              <Text style={styles.location}>{user.location}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatItem value={matches.length} label="Matches" />
          <View style={styles.statDivider} />
          <StatItem value={coins} label="Coins" goldValue />
          <View style={styles.statDivider} />
          <StatItem value={user.interests?.length ?? 0} label="Interests" />
        </View>

        {/* Wallet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <View style={styles.walletGlowWrap}>
            <LinearGradient
              colors={['#1a0a00', '#2a1000']}
              style={styles.walletCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.walletTop}>
                <View style={styles.walletCoinRow}>
                  <View style={styles.walletCoinIcon}>
                    <Ionicons name="logo-bitcoin" size={20} color={Colors.gold} />
                  </View>
                  <View>
                    <Text style={styles.walletLabel}>Saldo Koin</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={styles.walletBalance}>{animatedCoins.toLocaleString()}</Text>
                      <Text style={styles.walletUnit}>coins</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.walletUsd}>≈ ${(coins * 0.005).toFixed(2)} USD</Text>
              </View>

              <View style={styles.walletActions}>
                <Pressable
                  style={({ pressed }) => [styles.walletActionBtn, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => router.push('/topup')}
                >
                  <View style={styles.topUpGlowWrap}>
                    <LinearGradient
                      colors={['#FF4458', '#FF6B7A', '#CC2B3E']}
                      style={styles.walletActionGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                      <Text style={styles.walletActionTxt}>Top Up</Text>
                    </LinearGradient>
                  </View>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.walletActionBtnSecondary, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => router.push('/withdraw')}
                >
                  <View style={styles.walletActionOutline}>
                    <Ionicons name="arrow-up" size={15} color={Colors.muted} />
                    <Text style={styles.walletActionOutlineTxt}>Withdraw</Text>
                  </View>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {transactions.slice(0, 3).map((tx: Transaction) => {
            const cfg: Record<string, { icon: string; color: string }> = {
              topup: { icon: 'arrow-down-circle', color: Colors.success },
              withdraw: { icon: 'arrow-up-circle', color: Colors.warning },
              spent: { icon: 'remove-circle', color: Colors.primary },
              earned: { icon: 'add-circle', color: Colors.secondary },
            };
            const item = cfg[tx.type] ?? cfg.spent;
            const isPos = tx.type === 'topup' || tx.type === 'earned';
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: item.color + '22' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                <Text style={[styles.txAmt, { color: isPos ? Colors.success : Colors.primary }]}>
                  {isPos ? '+' : '-'}{tx.amount}
                </Text>
              </View>
            );
          })}
          {transactions.length === 0 && (
            <Text style={styles.txEmpty}>Belum ada transaksi</Text>
          )}
          <Pressable style={styles.walletLink} onPress={() => router.push('/(tabs)/wallet')}>
            <Text style={styles.walletLinkTxt}>Lihat semua riwayat transaksi</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Bio */}
        {user.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About me</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        ) : null}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsWrap}>
              {user.interests.map((interest) => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Lifestyle */}
        {lifestyleItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lifestyle</Text>
            <View style={styles.lifestyleRow}>
              {lifestyleItems.map((item) => (
                <View key={item.label} style={styles.lifestyleChip}>
                  <Ionicons name={item.icon as any} size={13} color={Colors.secondary} />
                  <Text style={styles.lifestyleChipTxt}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.prefRow}>
            <View style={styles.prefItem}>
              <Ionicons name="person-outline" size={16} color={Colors.muted} />
              <Text style={styles.prefLabel}>I am</Text>
              <Text style={styles.prefValue}>{user.gender || 'Not set'}</Text>
            </View>
            <View style={styles.prefItem}>
              <Ionicons name="heart-outline" size={16} color={Colors.muted} />
              <Text style={styles.prefLabel}>Looking for</Text>
              <Text style={styles.prefValue}>{user.lookingFor || 'Not set'}</Text>
            </View>
          </View>
          {(user.targetAgeMin || user.maxDistance) ? (
            <View style={[styles.prefRow, { marginTop: 10 }]}>
              {user.targetAgeMin && user.targetAgeMax && (
                <View style={styles.prefItem}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.muted} />
                  <Text style={styles.prefLabel}>Age range</Text>
                  <Text style={styles.prefValue}>{user.targetAgeMin}–{user.targetAgeMax} yrs</Text>
                </View>
              )}
              {user.maxDistance && (
                <View style={styles.prefItem}>
                  <Ionicons name="navigate-outline" size={16} color={Colors.muted} />
                  <Text style={styles.prefLabel}>Max distance</Text>
                  <Text style={styles.prefValue}>{user.maxDistance} km</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {[
            { icon: 'notifications-outline', label: 'Notifications', action: () => {} },
            { icon: 'shield-checkmark-outline', label: 'Privacy', action: () => {} },
            { icon: 'radio-outline', label: 'Connection Debug', action: () => router.push('/connection-debug') },
            { icon: 'help-circle-outline', label: 'Help & Support', action: () => {} },
            { icon: 'information-circle-outline', label: 'About', action: () => {} },
          ].map((item) => (
            <Pressable key={item.label} style={styles.settingItem} onPress={item.action}>
              <Ionicons name={item.icon as any} size={20} color={Colors.muted} />
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
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
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.primary + '20',
    borderRadius: 20,
  },
  editBtnTxt: { color: Colors.primary, fontSize: 13, fontFamily: 'Nunito_700Bold' },

  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  completionLeft: { flex: 1 },
  completionTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: Colors.foreground, marginBottom: 2 },
  completionSub: { fontSize: 12, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginBottom: 8 },
  completionTrack: { height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  completionFill: { height: 5, borderRadius: 3 },

  photoSection: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  mainPhotoWrapper: { position: 'relative', marginBottom: 10 },
  avatarGlowOuter: {
    shadowColor: '#FF4458',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 16,
    elevation: 14,
  },
  avatarGlowRing: {
    width: 118, height: 118, borderRadius: 59,
    padding: 3, alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: {
    width: 112, height: 112, borderRadius: 56,
    overflow: 'hidden', backgroundColor: Colors.background,
  },
  mainPhoto: { width: 112, height: 112, borderRadius: 56 },
  statusDot: {
    position: 'absolute', bottom: 4, left: 4,
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2.5, borderColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  statusDotInner: { width: 9, height: 9, borderRadius: 5 },
  morePhotos: { flexDirection: 'row' },
  extraPhoto: { width: 64, height: 64, borderRadius: 10, marginRight: 8 },

  nameSection: { paddingHorizontal: 20, marginBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 26, fontFamily: 'Nunito_800ExtraBold', color: Colors.foreground },
  age: { fontSize: 18, color: Colors.muted, fontFamily: 'Nunito_400Regular' },
  verifiedBadge: { marginLeft: 2 },
  verifiedLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  verifiedLabel: { fontSize: 12, color: '#1877F2', fontFamily: 'Nunito_700Bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 13, color: Colors.muted, fontFamily: 'Nunito_400Regular' },

  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: Colors.foreground },
  statLabel: { fontSize: 11, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginTop: 2 },
  statDivider: {
    width: 1,
    backgroundColor: 'transparent',
    borderLeftWidth: 1,
    borderLeftColor: Colors.primary + '55',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 16, fontFamily: 'Nunito_700Bold', color: Colors.foreground, marginBottom: 12,
  },
  bioText: {
    fontSize: 14, color: Colors.foregroundSecondary,
    fontFamily: 'Nunito_400Regular', lineHeight: 22,
  },
  interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Colors.radiusFull,
    backgroundColor: Colors.primary + '20',
    borderWidth: 1, borderColor: Colors.primary + '50',
  },
  interestText: { color: Colors.primary, fontSize: 13, fontFamily: 'Nunito_600SemiBold' },

  lifestyleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lifestyleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Colors.radiusFull,
    backgroundColor: Colors.secondary + '18',
    borderWidth: 1, borderColor: Colors.secondary + '40',
  },
  lifestyleChipTxt: { color: Colors.secondary, fontSize: 12, fontFamily: 'Nunito_600SemiBold' },

  prefRow: { flexDirection: 'row', gap: 12 },
  prefItem: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Colors.radius,
    borderWidth: 1, borderColor: Colors.border, padding: 12, gap: 4,
  },
  prefLabel: { fontSize: 11, color: Colors.muted, fontFamily: 'Nunito_400Regular' },
  prefValue: { fontSize: 14, color: Colors.foreground, fontFamily: 'Nunito_600SemiBold' },

  settingItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 14,
  },
  settingLabel: { flex: 1, fontSize: 15, color: Colors.foreground, fontFamily: 'Nunito_400Regular' },

  walletGlowWrap: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
    borderRadius: Colors.radiusLg,
  },
  walletCard: {
    borderRadius: Colors.radiusLg, padding: 16,
    borderWidth: 1, borderColor: Colors.gold + '30',
  },
  walletTop: { marginBottom: 12 },
  walletCoinRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  walletCoinIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  walletLabel: { fontSize: 11, color: Colors.muted, fontFamily: 'Nunito_400Regular' },
  walletBalance: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: Colors.gold },
  walletUnit: { fontSize: 14, color: Colors.muted, fontFamily: 'Nunito_400Regular' },
  walletUsd: { fontSize: 12, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginLeft: 48 },
  walletActions: { flexDirection: 'row', gap: 10 },
  walletActionBtn: { flex: 1.4, borderRadius: Colors.radiusFull, overflow: 'visible' },
  topUpGlowWrap: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
    borderRadius: Colors.radiusFull,
    overflow: 'hidden',
  },
  walletActionGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, gap: 5, borderRadius: Colors.radiusFull,
  },
  walletActionTxt: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  walletActionBtnSecondary: { flex: 1, borderRadius: Colors.radiusFull, overflow: 'hidden' },
  walletActionOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, gap: 5,
    borderWidth: 1, borderColor: Colors.border + 'AA', borderRadius: Colors.radiusFull,
    backgroundColor: Colors.card + '80',
  },
  walletActionOutlineTxt: { color: Colors.muted, fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
  },
  txIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  txDesc: { flex: 1, fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.foreground },
  txAmt: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  txEmpty: { color: Colors.muted, fontSize: 13, fontFamily: 'Nunito_400Regular', paddingVertical: 12 },
  walletLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingTop: 12,
  },
  walletLinkTxt: { color: Colors.primary, fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, paddingVertical: 14,
    borderRadius: Colors.radius,
    borderWidth: 1, borderColor: Colors.primary + '40',
    gap: 8, marginBottom: 8,
  },
  logoutText: { fontSize: 15, color: Colors.primary, fontFamily: 'Nunito_700Bold' },
});
