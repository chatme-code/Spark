import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
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

const MIN_WITHDRAW = 100;
const CONVERSION_RATE = 0.005; // 100 coins = $0.50

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const { coins, withdraw } = useWallet();
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  const coinAmount = parseInt(amount) || 0;
  const cashValue = (coinAmount * CONVERSION_RATE).toFixed(2);
  const isValid = coinAmount >= MIN_WITHDRAW && coinAmount <= coins && bankName && accountNumber && accountName;

  const handleWithdraw = async () => {
    if (!isValid) return;
    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${coinAmount} coins ($${cashValue}) to ${bankName} account ${accountNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const success = await withdraw(coinAmount, `Withdrawal to ${bankName} *${accountNumber.slice(-4)}`);
            setLoading(false);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Withdrawal Submitted',
                `Your withdrawal of $${cashValue} has been submitted. It will arrive in 1-3 business days.`,
                [{ text: 'Done', onPress: () => router.back() }]
              );
            } else {
              Alert.alert('Error', 'Insufficient coins for withdrawal');
            }
          },
        },
      ]
    );
  };

  const setQuickAmount = (pct: number) => {
    const amt = Math.floor(coins * pct / MIN_WITHDRAW) * MIN_WITHDRAW;
    setAmount(Math.max(0, amt).toString());
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={styles.balanceBadge}>
          <Ionicons name="logo-bitcoin" size={14} color={Colors.gold} />
          <Text style={styles.balanceText}>{coins}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* Balance Info */}
        <LinearGradient
          colors={['#1a0a00', '#2a1000']}
          style={styles.balanceCard}
        >
          <Text style={styles.availableLabel}>Available to withdraw</Text>
          <View style={styles.availableRow}>
            <Ionicons name="logo-bitcoin" size={24} color={Colors.gold} />
            <Text style={styles.availableCoins}>{coins.toLocaleString()}</Text>
            <Text style={styles.availableCoin}>coins</Text>
          </View>
          <Text style={styles.availableCash}>≈ ${(coins * CONVERSION_RATE).toFixed(2)} USD</Text>
        </LinearGradient>

        {/* Amount Input */}
        <Text style={styles.sectionTitle}>Withdrawal Amount</Text>
        <View style={styles.amountSection}>
          <View style={styles.amountInputWrapper}>
            <Ionicons name="logo-bitcoin" size={20} color={Colors.gold} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.muted}
            />
            <Text style={styles.amountSuffix}>coins</Text>
          </View>
          {coinAmount > 0 && (
            <Text style={styles.amountCash}>= ${cashValue} USD</Text>
          )}
          <View style={styles.quickAmounts}>
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <Pressable key={pct} style={styles.quickBtn} onPress={() => setQuickAmount(pct)}>
                <Text style={styles.quickBtnText}>{Math.round(pct * 100)}%</Text>
              </Pressable>
            ))}
          </View>
          {coinAmount > 0 && coinAmount < MIN_WITHDRAW && (
            <Text style={styles.errorText}>Minimum withdrawal is {MIN_WITHDRAW} coins</Text>
          )}
          {coinAmount > coins && (
            <Text style={styles.errorText}>Insufficient coins</Text>
          )}
        </View>

        {/* Bank Info */}
        <Text style={styles.sectionTitle}>Bank Details</Text>
        <View style={styles.bankSection}>
          <View style={styles.inputWrapper}>
            <Ionicons name="business-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.bankInput}
              placeholder="Bank Name"
              placeholderTextColor={Colors.muted}
              value={bankName}
              onChangeText={setBankName}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Ionicons name="card-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.bankInput}
              placeholder="Account Number"
              placeholderTextColor={Colors.muted}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={Colors.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.bankInput}
              placeholder="Account Holder Name"
              placeholderTextColor={Colors.muted}
              value={accountName}
              onChangeText={setAccountName}
            />
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.muted} />
          <Text style={styles.noteText}>
            Withdrawals are processed within 1-3 business days. 100 coins = $0.50 USD. Minimum withdrawal: 100 coins.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.withdrawBtn, !isValid && styles.withdrawBtnDisabled]}
          onPress={handleWithdraw}
          disabled={!isValid || loading}
        >
          <LinearGradient
            colors={isValid ? [Colors.primary, Colors.primaryDark] : [Colors.border, Colors.border]}
            style={styles.withdrawGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.withdrawBtnText}>
                Withdraw {coinAmount > 0 ? `${coinAmount} coins ($${cashValue})` : ''}
              </Text>
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
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold + '20',
    borderRadius: Colors.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  balanceText: { color: Colors.gold, fontSize: 13, fontFamily: 'Nunito_700Bold' },
  balanceCard: {
    marginHorizontal: 16,
    borderRadius: Colors.radiusLg,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  availableLabel: { fontSize: 13, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginBottom: 8 },
  availableRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  availableCoins: { fontSize: 36, fontFamily: 'Nunito_800ExtraBold', color: Colors.gold },
  availableCoin: { fontSize: 16, color: Colors.muted, fontFamily: 'Nunito_400Regular' },
  availableCash: { fontSize: 14, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginTop: 4 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.foreground,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  amountSection: { paddingHorizontal: 16, marginBottom: 8 },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.foreground,
  },
  amountSuffix: { fontSize: 14, color: Colors.muted, fontFamily: 'Nunito_400Regular' },
  amountCash: {
    fontSize: 14,
    color: Colors.success,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 10,
  },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  quickBtnText: { color: Colors.foreground, fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  errorText: { color: Colors.primary, fontSize: 12, fontFamily: 'Nunito_400Regular', marginTop: 4 },
  bankSection: { paddingHorizontal: 16, gap: 10 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  bankInput: {
    flex: 1,
    color: Colors.foreground,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
  },
  noteCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 14,
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  noteText: { flex: 1, fontSize: 12, color: Colors.muted, fontFamily: 'Nunito_400Regular', lineHeight: 18 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  withdrawBtn: { borderRadius: Colors.radiusFull, overflow: 'hidden' },
  withdrawBtnDisabled: { opacity: 0.6 },
  withdrawGradient: { paddingVertical: 16, alignItems: 'center' },
  withdrawBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
});
