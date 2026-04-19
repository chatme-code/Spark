import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useWallet } from '@/context/WalletContext';
import { Colors } from '@/constants/colors';

const PACKAGES = [
  { id: 'p1', coins: 100, price: 0.99, popular: false, bonus: 0 },
  { id: 'p2', coins: 500, price: 3.99, popular: true, bonus: 50 },
  { id: 'p3', coins: 1000, price: 7.99, popular: false, bonus: 150 },
  { id: 'p4', coins: 2500, price: 16.99, popular: false, bonus: 500 },
];

const PAYMENT_METHODS = [
  { id: 'card', icon: 'card-outline', label: 'Credit Card', detail: '**** 4242' },
  { id: 'apple', icon: 'logo-apple', label: 'Apple Pay', detail: '' },
  { id: 'google', icon: 'logo-google', label: 'Google Pay', detail: '' },
];

export default function TopUpScreen() {
  const insets = useSafeAreaInsets();
  const { topUp, coins } = useWallet();
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[1]);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0].id);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const totalCoins = selectedPackage.coins + selectedPackage.bonus;
    await topUp(totalCoins, `Purchased ${totalCoins} coins package`);
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Success!',
      `${totalCoins} coins have been added to your wallet.`,
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Top Up Coins</Text>
        <View style={styles.currentBalance}>
          <Ionicons name="logo-bitcoin" size={14} color={Colors.gold} />
          <Text style={styles.balanceText}>{coins}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <Text style={styles.sectionTitle}>Choose a package</Text>

        {PACKAGES.map((pkg) => {
          const isSelected = selectedPackage.id === pkg.id;
          const total = pkg.coins + pkg.bonus;
          return (
            <Pressable
              key={pkg.id}
              style={[styles.packageCard, isSelected && styles.packageCardActive]}
              onPress={() => {
                setSelectedPackage(pkg);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              <View style={styles.packageLeft}>
                <View style={styles.coinIconWrapper}>
                  <Ionicons name="logo-bitcoin" size={26} color={Colors.gold} />
                </View>
                <View>
                  <View style={styles.coinRow}>
                    <Text style={styles.packageCoins}>{pkg.coins.toLocaleString()}</Text>
                    {pkg.bonus > 0 && (
                      <View style={styles.bonusBadge}>
                        <Text style={styles.bonusText}>+{pkg.bonus} bonus</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.totalCoins}>{total.toLocaleString()} total coins</Text>
                </View>
              </View>
              <View style={styles.packageRight}>
                <Text style={styles.packagePrice}>${pkg.price}</Text>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle}>Payment method</Text>
        {PAYMENT_METHODS.map((method) => (
          <Pressable
            key={method.id}
            style={[styles.paymentMethod, selectedPayment === method.id && styles.paymentMethodActive]}
            onPress={() => setSelectedPayment(method.id)}
          >
            <View style={styles.paymentIcon}>
              <Ionicons name={method.icon as any} size={22} color={Colors.foreground} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>{method.label}</Text>
              {method.detail ? <Text style={styles.paymentDetail}>{method.detail}</Text> : null}
            </View>
            {selectedPayment === method.id && (
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}

        <View style={styles.secureNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.success} />
          <Text style={styles.secureText}>Payments are secure and encrypted</Text>
        </View>
      </ScrollView>

      {/* Purchase Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.purchaseBtn} onPress={handlePurchase} disabled={loading}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.purchaseGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.purchaseText}>
                  Purchase {(selectedPackage.coins + selectedPackage.bonus).toLocaleString()} coins
                </Text>
                <Text style={styles.purchasePrice}>${selectedPackage.price}</Text>
              </>
            )}
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  closeBtn: { marginRight: 12, padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.foreground },
  currentBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold + '20',
    borderRadius: Colors.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  balanceText: { color: Colors.gold, fontSize: 13, fontFamily: 'Nunito_700Bold' },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.foreground,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  packageCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  packageCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: Colors.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  popularText: { color: '#fff', fontSize: 11, fontFamily: 'Nunito_700Bold' },
  packageLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  coinIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  packageCoins: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: Colors.foreground },
  bonusBadge: {
    backgroundColor: Colors.success + '25',
    borderRadius: Colors.radiusFull,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bonusText: { color: Colors.success, fontSize: 11, fontFamily: 'Nunito_700Bold' },
  totalCoins: { fontSize: 12, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginTop: 2 },
  packageRight: { alignItems: 'flex-end', gap: 6 },
  packagePrice: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.foreground },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethod: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.mutedBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.foreground },
  paymentDetail: { fontSize: 12, color: Colors.muted, fontFamily: 'Nunito_400Regular' },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  secureText: { fontSize: 12, color: Colors.muted, fontFamily: 'Nunito_400Regular' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  purchaseBtn: { borderRadius: Colors.radiusFull, overflow: 'hidden' },
  purchaseGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  purchaseText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  purchasePrice: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
  },
});
