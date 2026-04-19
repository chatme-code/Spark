import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Share } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const TUNNEL_HINT = 'exp://xwncvmm-anonymous-5000.exp.direct';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ConnectionDebugScreen() {
  const insets = useSafeAreaInsets();
  const appUrl = Linking.createURL('/');
  const webUrl = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : '';
  const visibleUrl = webUrl || appUrl || TUNNEL_HINT;
  const isMobileRuntime = Platform.OS === 'ios' || Platform.OS === 'android';
  const looksLikeTunnel = visibleUrl.includes('exp.direct') || visibleUrl.includes('ngrok');

  const handleShare = async () => {
    await Share.share({
      message: TUNNEL_HINT,
    });
  };

  return (
    <View style={[styles.root, { paddingTop: Platform.OS === 'web' ? 56 : insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Connection Debug</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: looksLikeTunnel ? Colors.success + '20' : Colors.warning + '20' }]}>
            <Ionicons
              name={looksLikeTunnel ? 'checkmark-circle' : 'alert-circle'}
              size={32}
              color={looksLikeTunnel ? Colors.success : Colors.warning}
            />
          </View>
          <Text style={styles.statusTitle}>
            {looksLikeTunnel ? 'Tunnel mode detected' : 'Tunnel workflow is enabled'}
          </Text>
          <Text style={styles.statusText}>
            Jalankan aplikasi lewat QR Expo Go. Link HP seharusnya memakai alamat exp.direct/ngrok, bukan IP lokal 172.x.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Runtime</Text>
          <View style={styles.panel}>
            <InfoRow label="Platform" value={Platform.OS} />
            <InfoRow label="Mode" value={isMobileRuntime ? 'Expo Go / Mobile' : 'Web Preview'} />
            <InfoRow label="Tunnel package" value="@expo/ngrok installed" />
            <InfoRow label="Expo command" value="expo start --tunnel --port 5000" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current URL</Text>
          <View style={styles.urlBox}>
            <Text style={styles.urlText}>{visibleUrl}</Text>
          </View>
          <Text style={styles.helperText}>
            Di web preview, URL bisa terlihat sebagai alamat Replit/browser. Untuk HP, gunakan QR code dari console Expo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mobile Tunnel</Text>
          <View style={styles.urlBox}>
            <Text style={styles.urlText}>{TUNNEL_HINT}</Text>
          </View>
          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.shareText}>Share tunnel link</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cara pakai di HP</Text>
          {[
            'Pastikan workflow Start Frontend sedang running.',
            'Buka Expo Go di HP.',
            'Scan QR code yang muncul di console.',
            'Pastikan link yang terbuka berisi exp.direct, bukan 172.x.',
          ].map((item, index) => (
            <View key={item} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{item}</Text>
            </View>
          ))}
        </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.foreground,
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
  },
  headerSpacer: { width: 42 },
  content: { paddingHorizontal: 20 },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: Colors.radiusLg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 22,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusTitle: {
    color: Colors.foreground,
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusText: {
    color: Colors.foregroundSecondary,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 21,
    textAlign: 'center',
  },
  section: { marginBottom: 22 },
  sectionTitle: {
    color: Colors.foreground,
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 12,
  },
  panel: {
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
  },
  infoValue: {
    color: Colors.foreground,
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
  },
  urlBox: {
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  urlText: {
    color: Colors.foreground,
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 20,
  },
  helperText: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
    marginTop: 8,
  },
  shareBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: Colors.radiusFull,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  shareText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: 'Nunito_800ExtraBold',
  },
  stepText: {
    flex: 1,
    color: Colors.foregroundSecondary,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
  },
});