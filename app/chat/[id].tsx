import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useChat, ChatMessage } from '@/context/ChatContext';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { formatTime } from '@/utils/time';

const { width: SW } = Dimensions.get('window');
const MESSAGE_COST = 5;
const MEDIA_EARN = 5;

// ── Gift catalogue ──────────────────────────────────────────────
const GIFTS = [
  { id: 'g1', emoji: '❤️', name: 'Hati', cost: 5 },
  { id: 'g2', emoji: '🌹', name: 'Bunga', cost: 10 },
  { id: 'g3', emoji: '🚀', name: 'Roket', cost: 15 },
  { id: 'g4', emoji: '🧸', name: 'Boneka', cost: 20 },
  { id: 'g5', emoji: '🎂', name: 'Kue', cost: 30 },
  { id: 'g6', emoji: '👑', name: 'Mahkota', cost: 50 },
  { id: 'g7', emoji: '💎', name: 'Berlian', cost: 100 },
  { id: 'g8', emoji: '💍', name: 'Cincin', cost: 200 },
];

// ── Coin toast helper ────────────────────────────────────────────
function useCoinToast() {
  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState(0);

  const show = (coins: number) => {
    setAmount(coins);
    setVisible(true);
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  return { show, visible, amount, anim };
}

export default function ChatroomScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { matches } = useApp();
  const { getMessages, sendMessage, sendSpecialMessage, updateMessage, markRead } = useChat();
  const { coins, spend, earn } = useWallet();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [giftModal, setGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<typeof GIFTS[0] | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const toast = useCoinToast();

  const match = matches.find((m) => m.id === id);
  const messages = getMessages(id ?? '');

  useEffect(() => {
    if (id) markRead(id);
  }, [id, messages.length]);

  // ── Send text ──────────────────────────────────────────────────
  const handleSend = async () => {
    if (!text.trim() || !id || !user) return;
    if (coins < MESSAGE_COST) {
      Alert.alert('Koin tidak cukup', `Setiap pesan membutuhkan ${MESSAGE_COST} koin.`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Top Up', onPress: () => router.push('/topup') },
      ]);
      return;
    }
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msgText = text.trim();
    setText('');
    await spend(MESSAGE_COST, `Pesan ke ${match?.profile.name}`);
    await sendMessage(id, msgText, 'user');
    setSending(false);
  };

  // ── Send gift ──────────────────────────────────────────────────
  const handleSendGift = async (gift: typeof GIFTS[0]) => {
    if (!id) return;
    if (coins < gift.cost) {
      Alert.alert('Koin tidak cukup', `Hadiah ini membutuhkan ${gift.cost} koin.`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Top Up', onPress: () => router.push('/topup') },
      ]);
      return;
    }
    setGiftModal(false);
    setSelectedGift(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await spend(gift.cost, `Hadiah ${gift.emoji} ke ${match?.profile.name}`);
    await sendSpecialMessage(id, {
      type: 'gift',
      text: `Mengirim hadiah ${gift.emoji}`,
      giftEmoji: gift.emoji,
      giftName: gift.name,
      giftCost: gift.cost,
    });
  };

  // ── Send photo ─────────────────────────────────────────────────
  const handleSendMedia = async (mediaType: 'photo' | 'video') => {
    if (!id) return;
    const opts: ImagePicker.ImagePickerOptions =
      mediaType === 'video'
        ? { mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.7 }
        : { mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 };

    const result = await ImagePicker.launchImageLibraryAsync(opts);
    if (result.canceled || !result.assets[0]) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const asset = result.assets[0];
    const msg = await sendSpecialMessage(id, {
      type: mediaType,
      text: mediaType === 'photo' ? 'Mengirim foto 📷' : 'Mengirim video 🎬',
      mediaUri: asset.uri,
      mediaOpened: false,
    });

    // Simulate: "them" opens media after 4-6 seconds → earn coins
    const delay = 4000 + Math.random() * 2000;
    setTimeout(async () => {
      await updateMessage(id, msg.id, { mediaOpened: true });
      await earn(MEDIA_EARN, `${match?.profile.name} membuka ${mediaType === 'photo' ? 'foto' : 'video'} kamu`);
      await sendSpecialMessage(id, {
        type: 'system',
        senderId: 'system',
        text: `${match?.profile.name} membuka ${mediaType === 'photo' ? 'fotomu' : 'videomu'} • +${MEDIA_EARN} koin 🪙`,
      });
      toast.show(MEDIA_EARN);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, delay);
  };

  if (!match) {
    return (
      <View style={s.notFound}>
        <Text style={s.notFoundText}>Match tidak ditemukan</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: Colors.primary }}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  // ── Message renderer ───────────────────────────────────────────
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === 'user';
    const isSystem = item.type === 'system' || item.senderId === 'system';

    if (isSystem) {
      return (
        <View style={s.systemRow}>
          <View style={s.systemBubble}>
            <Ionicons name="sparkles" size={12} color={Colors.gold} />
            <Text style={s.systemText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'gift') {
      return (
        <View style={[s.msgRow, isMe ? s.msgRowRight : s.msgRowLeft]}>
          {!isMe && <Image source={{ uri: match.profile.photos[0] }} style={s.msgAvatar} />}
          <View style={[s.giftBubble, isMe ? s.giftBubbleMe : s.giftBubbleThem]}>
            <Text style={s.giftEmoji}>{item.giftEmoji}</Text>
            <Text style={s.giftName}>{item.giftName}</Text>
            <View style={s.giftCostRow}>
              <Ionicons name="logo-bitcoin" size={11} color={Colors.gold} />
              <Text style={s.giftCost}>{item.giftCost} koin</Text>
            </View>
            <Text style={[s.bubbleTime, s.giftTime]}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'photo' || item.type === 'video') {
      return (
        <View style={[s.msgRow, isMe ? s.msgRowRight : s.msgRowLeft]}>
          {!isMe && <Image source={{ uri: match.profile.photos[0] }} style={s.msgAvatar} />}
          <View style={[s.mediaBubble, isMe ? s.mediaBubbleMe : s.mediaBubbleThem]}>
            {item.mediaUri ? (
              <View style={s.mediaPreviewWrap}>
                <Image source={{ uri: item.mediaUri }} style={s.mediaPreview} blurRadius={item.mediaOpened || isMe ? 0 : 12} />
                {item.type === 'video' && (
                  <View style={s.videoPlayBtn}>
                    <Ionicons name="play" size={22} color="#fff" />
                  </View>
                )}
                {isMe && (
                  <View style={[s.mediaStatusBadge, item.mediaOpened ? s.mediaStatusOpen : s.mediaStatusPending]}>
                    <Ionicons
                      name={item.mediaOpened ? 'eye' : 'eye-off-outline'}
                      size={11}
                      color="#fff"
                    />
                    <Text style={s.mediaStatusText}>
                      {item.mediaOpened ? `Dibuka • +${MEDIA_EARN} koin` : 'Menunggu dibuka...'}
                    </Text>
                  </View>
                )}
                {!isMe && !item.mediaOpened && (
                  <View style={s.mediaLockOverlay}>
                    <Ionicons name="lock-closed" size={22} color="#fff" />
                    <Text style={s.mediaLockText}>Ketuk untuk buka</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={s.mediaPlaceholder}>
                <Ionicons name={item.type === 'video' ? 'videocam' : 'image'} size={28} color={Colors.muted} />
              </View>
            )}
            <Text style={[s.bubbleTime, isMe ? s.bubbleTimeMe : s.bubbleTimeThem, { marginTop: 4, marginHorizontal: 4 }]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      );
    }

    // Default: text message
    return (
      <View style={[s.msgRow, isMe ? s.msgRowRight : s.msgRowLeft]}>
        {!isMe && <Image source={{ uri: match.profile.photos[0] }} style={s.msgAvatar} />}
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
          <Text style={[s.bubbleText, isMe ? s.bubbleTextMe : s.bubbleTextThem]}>
            {item.text}
          </Text>
          <Text style={[s.bubbleTime, isMe ? s.bubbleTimeMe : s.bubbleTimeThem]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.foreground} />
        </Pressable>
        <Pressable style={s.headerProfile}>
          <Image source={{ uri: match.profile.photos[0] }} style={s.headerAvatar} />
          <View style={s.onlineDot} />
        </Pressable>
        <View style={s.headerInfo}>
          <Text style={s.headerName}>{match.profile.name}</Text>
          <Text style={s.headerStatus}>Online now</Text>
        </View>
        <View style={s.coinIndicator}>
          <Ionicons name="logo-bitcoin" size={14} color={Colors.gold} />
          <Text style={s.coinText}>{coins}</Text>
        </View>
        <Pressable style={s.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.foreground} />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={s.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={s.emptyChat}>
            <View style={s.matchBadge}>
              <Text style={s.matchBadgeText}>
                Kamu match dengan {match.profile.name}! Sapa dia 👋
              </Text>
            </View>
            <Text style={s.costNote}>Setiap pesan membutuhkan {MESSAGE_COST} koin</Text>
          </View>
        }
      />

      {/* Coin earned toast */}
      {toast.visible && (
        <Animated.View
          style={[
            s.toast,
            {
              opacity: toast.anim,
              transform: [{ translateY: toast.anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <Ionicons name="logo-bitcoin" size={16} color={Colors.gold} />
          <Text style={s.toastText}>+{toast.amount} koin diterima!</Text>
        </Animated.View>
      )}

      {/* Input bar */}
      <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        {/* Gift button */}
        <Pressable style={s.actionBtn} onPress={() => { setGiftModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <Ionicons name="gift" size={22} color={Colors.primary} />
        </Pressable>

        {/* Photo button */}
        <Pressable style={s.actionBtn} onPress={() => handleSendMedia('photo')}>
          <Ionicons name="image" size={22} color={Colors.primary} />
        </Pressable>

        {/* Video button */}
        <Pressable style={s.actionBtn} onPress={() => handleSendMedia('video')}>
          <Ionicons name="videocam" size={22} color={Colors.primary} />
        </Pressable>

        {/* Text input */}
        <View style={s.inputWrapper}>
          <TextInput
            style={s.input}
            placeholder="Ketik pesan..."
            placeholderTextColor={Colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
        </View>

        {/* Send */}
        <View style={s.sendCol}>
          <View style={s.coinCost}>
            <Ionicons name="logo-bitcoin" size={11} color={Colors.gold} />
            <Text style={s.coinCostText}>{MESSAGE_COST}</Text>
          </View>
          <Pressable
            style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* ── Gift Modal ── */}
      <Modal
        visible={giftModal}
        transparent
        animationType="slide"
        onRequestClose={() => setGiftModal(false)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setGiftModal(false)}>
          <Pressable style={[s.giftModal, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
            {/* Modal header */}
            <View style={s.giftModalHeader}>
              <View style={s.giftModalHandle} />
              <Text style={s.giftModalTitle}>Kirim Hadiah</Text>
              <Text style={s.giftModalSub}>Pilih hadiah untuk {match.profile.name}</Text>
            </View>

            {/* 4-column grid */}
            <View style={s.giftGrid}>
              {GIFTS.map((gift) => {
                const isSel = selectedGift?.id === gift.id;
                const canAfford = coins >= gift.cost;
                return (
                  <Pressable
                    key={gift.id}
                    style={[s.giftItem, isSel && s.giftItemSelected, !canAfford && s.giftItemDisabled]}
                    onPress={() => {
                      setSelectedGift(gift);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={s.giftItemEmoji}>{gift.emoji}</Text>
                    <Text style={[s.giftItemName, !canAfford && s.giftItemNameDisabled]}>{gift.name}</Text>
                    <View style={s.giftItemCostRow}>
                      <Ionicons name="logo-bitcoin" size={10} color={canAfford ? Colors.gold : Colors.muted} />
                      <Text style={[s.giftItemCost, !canAfford && s.giftItemCostDisabled]}>{gift.cost}</Text>
                    </View>
                    {isSel && (
                      <View style={s.giftItemCheck}>
                        <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Send gift button */}
            <Pressable
              style={[s.sendGiftBtn, !selectedGift && s.sendGiftBtnDisabled]}
              onPress={() => selectedGift && handleSendGift(selectedGift)}
              disabled={!selectedGift}
            >
              <LinearGradient
                colors={selectedGift ? [Colors.primary, Colors.primaryDark] : ['#333', '#2a2a2a']}
                style={s.sendGiftGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {selectedGift ? (
                  <>
                    <Text style={s.sendGiftEmoji}>{selectedGift.emoji}</Text>
                    <Text style={s.sendGiftTxt}>Kirim {selectedGift.name}</Text>
                    <View style={s.sendGiftCostBadge}>
                      <Ionicons name="logo-bitcoin" size={12} color={Colors.gold} />
                      <Text style={s.sendGiftCostBadgeTxt}>{selectedGift.cost}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={s.sendGiftTxt}>Pilih hadiah dulu</Text>
                )}
              </LinearGradient>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  notFoundText: { color: Colors.foreground, fontSize: 16, marginBottom: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: 4, padding: 4 },
  headerProfile: { position: 'relative', marginRight: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.card,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: Colors.foreground },
  headerStatus: { fontSize: 12, color: Colors.success, fontFamily: 'Nunito_400Regular' },
  coinIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.gold + '20', borderRadius: Colors.radiusFull,
    paddingHorizontal: 8, paddingVertical: 4, marginRight: 6,
  },
  coinText: { color: Colors.gold, fontSize: 12, fontFamily: 'Nunito_700Bold' },
  moreBtn: { padding: 4 },

  // Messages
  messagesList: { paddingHorizontal: 12, paddingVertical: 16, flexGrow: 1 },
  emptyChat: { alignItems: 'center', paddingTop: 40 },
  matchBadge: {
    backgroundColor: Colors.primary + '20', borderRadius: Colors.radiusLg,
    paddingHorizontal: 20, paddingVertical: 12, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  matchBadgeText: { color: Colors.foreground, fontSize: 14, textAlign: 'center', fontFamily: 'Nunito_600SemiBold' },
  costNote: { fontSize: 12, color: Colors.muted, fontFamily: 'Nunito_400Regular' },

  // System message
  systemRow: { alignItems: 'center', marginVertical: 8 },
  systemBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.gold + '18', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.gold + '30',
  },
  systemText: { color: Colors.gold, fontSize: 12, fontFamily: 'Nunito_600SemiBold' },

  // Chat row
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 6 },

  // Text bubble
  bubble: { maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 6 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: 15, lineHeight: 22, fontFamily: 'Nunito_400Regular' },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: Colors.foreground },
  bubbleTime: { fontSize: 10, marginTop: 2, fontFamily: 'Nunito_400Regular' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeThem: { color: Colors.muted },

  // Gift bubble
  giftBubble: {
    borderRadius: 18, padding: 14, alignItems: 'center',
    minWidth: 110, maxWidth: 150,
    borderWidth: 1,
  },
  giftBubbleMe: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary + '60', borderBottomRightRadius: 4 },
  giftBubbleThem: { backgroundColor: Colors.card, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  giftEmoji: { fontSize: 38, marginBottom: 4 },
  giftName: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: Colors.foreground, marginBottom: 2 },
  giftCostRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  giftCost: { fontSize: 11, color: Colors.gold, fontFamily: 'Nunito_600SemiBold' },
  giftTime: { color: Colors.muted, marginTop: 6 },

  // Media bubble
  mediaBubble: { borderRadius: 18, overflow: 'hidden', maxWidth: 220, borderWidth: 1 },
  mediaBubbleMe: { borderColor: Colors.primary + '60', borderBottomRightRadius: 4 },
  mediaBubbleThem: { borderColor: Colors.border, borderBottomLeftRadius: 4 },
  mediaPreviewWrap: { position: 'relative' },
  mediaPreview: { width: 200, height: 200 },
  videoPlayBtn: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -22, marginLeft: -22,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  mediaStatusBadge: {
    position: 'absolute', bottom: 6, left: 6, right: 6,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  mediaStatusPending: { backgroundColor: 'rgba(0,0,0,0.6)' },
  mediaStatusOpen: { backgroundColor: 'rgba(24,119,242,0.85)' },
  mediaStatusText: { color: '#fff', fontSize: 10, fontFamily: 'Nunito_600SemiBold', flex: 1 },
  mediaLockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)', gap: 6,
  },
  mediaLockText: { color: '#fff', fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  mediaPlaceholder: {
    width: 200, height: 200,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center', justifyContent: 'center',
  },

  // Toast
  toast: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.gold + '60',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: Colors.gold, shadowOpacity: 0.3, shadowRadius: 8,
  },
  toastText: { color: Colors.gold, fontSize: 14, fontFamily: 'Nunito_700Bold' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 8, paddingTop: 10,
    backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, gap: 6,
  },
  actionBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  inputWrapper: {
    flex: 1, backgroundColor: Colors.mutedBackground,
    borderRadius: 22, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 8, maxHeight: 100,
  },
  input: { color: Colors.foreground, fontSize: 15, fontFamily: 'Nunito_400Regular', maxHeight: 80 },
  sendCol: { alignItems: 'center', gap: 4, marginBottom: 2 },
  coinCost: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  coinCostText: { color: Colors.gold, fontSize: 10, fontFamily: 'Nunito_700Bold' },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },

  // Gift modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  giftModal: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, borderWidth: 1, borderColor: Colors.border,
  },
  giftModalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16,
  },
  giftModalHeader: { paddingHorizontal: 20, marginBottom: 16 },
  giftModalTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: Colors.foreground },
  giftModalSub: { fontSize: 13, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginTop: 2 },
  giftGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 16,
  },
  giftItem: {
    width: (SW - 32 - 30) / 4, // 4 columns
    aspectRatio: 0.85,
    backgroundColor: Colors.cardElevated, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 3,
    borderWidth: 2, borderColor: 'transparent',
    position: 'relative',
  },
  giftItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  giftItemDisabled: { opacity: 0.45 },
  giftItemEmoji: { fontSize: 28 },
  giftItemName: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: Colors.foreground, textAlign: 'center' },
  giftItemNameDisabled: { color: Colors.muted },
  giftItemCostRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  giftItemCost: { fontSize: 10, color: Colors.gold, fontFamily: 'Nunito_700Bold' },
  giftItemCostDisabled: { color: Colors.muted },
  giftItemCheck: { position: 'absolute', top: 4, right: 4 },
  sendGiftBtn: { marginHorizontal: 16, borderRadius: 50, overflow: 'hidden' },
  sendGiftBtnDisabled: { opacity: 0.6 },
  sendGiftGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
  },
  sendGiftEmoji: { fontSize: 20 },
  sendGiftTxt: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  sendGiftCostBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  sendGiftCostBadgeTxt: { color: Colors.gold, fontSize: 12, fontFamily: 'Nunito_700Bold' },
});
