import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWallet, Transaction } from '@/context/WalletContext';
import { Colors } from '@/constants/colors';
import { formatDistanceToNow } from '@/utils/time';

const TX_ICONS: Record<Transaction['type'], { icon: string; color: string }> = {
  topup: { icon: 'arrow-down-circle', color: Colors.success },
  withdraw: { icon: 'arrow-up-circle', color: Colors.warning },
  spent: { icon: 'remove-circle', color: Colors.primary },
  earned: { icon: 'add-circle', color: Colors.secondary },
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { coins, transactions } = useWallet();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const cashValue = (coins * 0.005).toFixed(2);

  const renderTx = ({ item }: { item: Transaction }) => {
    const cfg = TX_ICONS[item.type];
    const isPositive = item.type === 'topup' || item.type === 'earned';
    return (
      <View style={styles.txItem}>
        <View style={[styles.txIcon, { backgroundColor: cfg.color + '20' }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDescription} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.txTime}>{formatDistanceToNow(item.createdAt)}</Text>
        </View>
        <Text style={[styles.txAmount, { color: isPositive ? Colors.success : Colors.primary }]}>
          {isPositive ? '+' : '-'}{item.amount}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <LinearGradient
              colors={['#1a0a00', '#2a1000']}
              style={styles.balanceCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.coinIconLarge}>
                <Ionicons name="logo-bitcoin" size={32} color={Colors.gold} />
              </View>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>{coins.toLocaleString()}</Text>
                <Text style={styles.balanceCoin}>coins</Text>
              </View>
              <Text style={styles.cashEquiv}>≈ ${cashValue} USD</Text>

              <View style={styles.cardActions}>
                <Pressable style={styles.cardActionBtn} onPress={() => router.push('/topup')}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.cardActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.cardActionText}>Top Up</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable style={styles.cardActionBtn} onPress={() => router.push('/withdraw')}>
                  <View style={styles.cardActionOutline}>
                    <Ionicons name="arrow-up" size={18} color={Colors.foreground} />
                    <Text style={styles.cardActionOutlineText}>Withdraw</Text>
                  </View>
                </Pressable>
              </View>
            </LinearGradient>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="heart" size={20} color={Colors.primary} />
                <Text style={styles.statValue}>Free</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="star" size={20} color={Colors.superlike} />
                <Text style={styles.statValue}>10</Text>
                <Text style={styles.statLabel}>Super Like</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="chatbubble" size={20} color={Colors.secondary} />
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Message</Text>
              </View>
            </View>

            {/* Transactions Header */}
            <View style={styles.txHeader}>
              <Text style={styles.txHeaderTitle}>Transaction History</Text>
            </View>

            {transactions.length === 0 && (
              <View style={styles.emptyTx}>
                <Ionicons name="receipt-outline" size={40} color={Colors.muted} />
                <Text style={styles.emptyTxText}>No transactions yet</Text>
              </View>
            )}
          </>
        }
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTx}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.foreground,
  },
  balanceCard: {
    marginHorizontal: 16,
    borderRadius: Colors.radiusLg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coinIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  balanceAmount: {
    fontSize: 48,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.gold,
  },
  balanceCoin: {
    fontSize: 18,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
  },
  cashEquiv: {
    fontSize: 14,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 4,
    marginBottom: 20,
  },
  cardActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cardActionBtn: { flex: 1, borderRadius: Colors.radiusFull, overflow: 'hidden' },
  cardActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  cardActionText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  cardActionOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Colors.radiusFull,
  },
  cardActionOutlineText: {
    color: Colors.foreground,
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.foreground,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
  },
  txHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  txHeaderTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.foreground,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1, marginLeft: 12 },
  txDescription: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.foreground,
  },
  txTime: {
    fontSize: 12,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  emptyTx: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTxText: {
    fontSize: 14,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
  },
});
