import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { INTERESTS_LIST } from '@/data/mockProfiles';

const { width: SW, height: SH } = Dimensions.get('window');
const TOTAL_STEPS = 5;

type FacePhase =
  | 'idle'
  | 'analyzing_ref'
  | 'ref_error'
  | 'ref_ready'
  | 'camera_open'
  | 'comparing'
  | 'blur_error'
  | 'no_match'
  | 'verified';

const PHASE_LABELS: Partial<Record<FacePhase, string>> = {
  analyzing_ref: 'Menganalisis foto...',
  comparing: 'Membandingkan wajah...',
};

function isImageBlurry(width: number, height: number): boolean {
  return width < 200 || height < 200;
}

export default function KycScreen() {
  const insets = useSafeAreaInsets();
  const { completeKyc } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ── Step 1: Face Verification state ──
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facePhase, setFacePhase] = useState<FacePhase>('idle');
  const [refPhoto, setRefPhoto] = useState<string | null>(null);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  const verifyScale = useRef(new Animated.Value(0)).current;
  const verifyOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLine = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const scanLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ── Step 2-5 ──
  const [photos, setPhotos] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [lookingFor, setLookingFor] = useState<'male' | 'female' | 'both' | ''>('');
  const [interests, setInterests] = useState<string[]>([]);

  const startPulse = () => {
    pulseLoop.current?.stop();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    pulseLoop.current = loop;
    loop.start();
  };

  const startScan = () => {
    scanLine.setValue(0);
    scanLoop.current?.stop();
    const loop = Animated.loop(
      Animated.timing(scanLine, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.linear })
    );
    scanLoop.current = loop;
    loop.start();
  };

  const stopAnimations = () => {
    pulseLoop.current?.stop();
    scanLoop.current?.stop();
    pulseAnim.setValue(1);
  };

  const showVerifiedAnimation = () => {
    Animated.parallel([
      Animated.spring(verifyScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }),
      Animated.timing(verifyOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const resetVerification = () => {
    verifyScale.setValue(0);
    verifyOpacity.setValue(0);
    scanLine.setValue(0);
    stopAnimations();
  };

  // ── Upload reference photo ──
  const pickReferencePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setRefPhoto(asset.uri);
    setFacePhase('analyzing_ref');
    setLivePhoto(null);
    resetVerification();
    setRetryCount(0);

    // Blur check on reference photo
    await new Promise((r) => setTimeout(r, 1600));

    if (isImageBlurry(asset.width ?? 500, asset.height ?? 500)) {
      setFacePhase('ref_error');
      setRefPhoto(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setFacePhase('ref_ready');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // ── Open camera ──
  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        Alert.alert('Izin Kamera', 'Izin kamera diperlukan untuk verifikasi wajah');
        return;
      }
    }
    setFacePhase('camera_open');
    startPulse();
  };

  // ── Capture live photo ──
  const captureLive = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) return;
      stopAnimations();
      setFacePhase('comparing');
      setLivePhoto(photo.uri);
      startScan();

      // Simulate: blur check on live photo
      await new Promise((r) => setTimeout(r, 800));
      if (isImageBlurry(photo.width ?? 500, photo.height ?? 500)) {
        stopAnimations();
        setLivePhoto(null);
        setFacePhase('blur_error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Simulate: face match comparison (takes ~2.5s)
      await new Promise((r) => setTimeout(r, 2000));
      stopAnimations();

      // Realistic match logic: pass on first attempt, very rarely fails
      const shouldPass = retryCount > 0 ? true : Math.random() > 0.08;
      if (!shouldPass) {
        setFacePhase('no_match');
        setLivePhoto(null);
        setRetryCount((c) => c + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setFacePhase('verified');
      showVerifiedAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      stopAnimations();
      setFacePhase('ref_ready');
      Alert.alert('Error', 'Gagal mengambil foto. Coba lagi.');
    }
  };

  const retryFromCamera = () => {
    setLivePhoto(null);
    setFacePhase('camera_open');
    startPulse();
  };

  const retryFromUpload = () => {
    setRefPhoto(null);
    setLivePhoto(null);
    setFacePhase('idle');
    resetVerification();
  };

  // ── Profile photo picker ──
  const pickProfilePhoto = async () => {
    if (photos.length >= 6) {
      Alert.alert('Batas Tercapai', 'Maksimal 6 foto');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests((prev) => prev.filter((i) => i !== interest));
    } else if (interests.length < 10) {
      setInterests((prev) => [...prev, interest]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const goNext = () => {
    if (step === 1 && facePhase !== 'verified') {
      Alert.alert('Verifikasi Wajah', 'Selesaikan verifikasi wajah terlebih dahulu');
      return;
    }
    if (step === 2 && photos.length === 0) {
      Alert.alert('Tambah Foto', 'Tambahkan minimal 1 foto profil');
      return;
    }
    if (step === 3 && !bio.trim()) {
      Alert.alert('Tulis Bio', 'Tuliskan sesuatu tentang dirimu');
      return;
    }
    if (step === 4 && (!gender || !lookingFor)) {
      Alert.alert('Preferensi', 'Pilih gender dan preferensi pencarian');
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeKyc({ photos, bio: bio.trim(), age: parseInt(age) || 25, gender, lookingFor, interests, verified: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Gagal menyimpan profil. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const scanTranslateY = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });

  // ════════════════════════════════════════════
  // CAMERA VIEW
  // ════════════════════════════════════════════
  if (facePhase === 'camera_open') {
    return (
      <View style={s.fullScreen}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />

        {/* Dark overlay with oval cutout effect */}
        <View style={s.camOverlay}>
          {/* Header */}
          <View style={[s.camHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable onPress={() => { stopAnimations(); setFacePhase('ref_ready'); }} style={s.camClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
            <Text style={s.camTitle}>Verifikasi Wajah Live</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Face guide */}
          <View style={s.camGuideArea}>
            <Animated.View style={[s.faceOval, { transform: [{ scale: pulseAnim }] }]}>
              {/* Corner brackets */}
              {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
                <View key={pos} style={[s.corner, s[pos]]} />
              ))}
              {/* Scan line */}
              <View style={s.ovalClip}>
                <Animated.View style={[s.scanLine, { transform: [{ translateY: scanTranslateY }] }]} />
              </View>
            </Animated.View>

            {/* Instruction below oval */}
            <View style={s.camInstruction}>
              <Text style={s.camInstrText}>Pastikan wajah berada di dalam oval</Text>
              <Text style={s.camInstrSub}>Hadap kamera langsung • Cahaya cukup • Tidak buram</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={[s.camFooter, { paddingBottom: insets.bottom + 24 }]}>
            <View style={s.refThumbWrap}>
              {refPhoto && <Image source={{ uri: refPhoto }} style={s.refThumb} />}
              <Text style={s.refThumbLabel}>Referensi</Text>
            </View>
            <Pressable onPress={captureLive} style={s.captureBtn}>
              <View style={s.captureBtnInner} />
            </Pressable>
            <View style={{ width: 60 }} />
          </View>
        </View>
      </View>
    );
  }

  // ════════════════════════════════════════════
  // MAIN KYC SCROLL VIEW
  // ════════════════════════════════════════════
  return (
    <View style={s.root}>
      <LinearGradient colors={['#150010', '#0D0D0D']} style={StyleSheet.absoluteFill} />

      {/* Progress header */}
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        {step > 1 && facePhase !== 'comparing' && (
          <Pressable onPress={() => setStep((p) => p - 1)} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </Pressable>
        )}
        <View style={s.progRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[s.progBar, i < step && s.progBarActive]} />
          ))}
        </View>
        <Text style={s.stepLabel}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ══ STEP 1: Face Verification ══ */}
        {step === 1 && (
          <View>
            <View style={s.kycTagRow}>
              <View style={s.kycTag}>
                <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
                <Text style={s.kycTagText}>KYC — Verifikasi Wajah</Text>
              </View>
            </View>
            <Text style={s.title}>Verifikasi Identitas</Text>
            <Text style={s.subtitle}>Upload foto wajah, lalu ambil selfie live untuk dicocokkan</Text>

            {/* FLOW CARD */}
            <View style={s.flowCard}>

              {/* ── Phase: idle / ref_error ── */}
              {(facePhase === 'idle' || facePhase === 'ref_error') && (
                <View>
                  {facePhase === 'ref_error' && (
                    <View style={s.errorBanner}>
                      <Ionicons name="warning" size={18} color="#FF9F0A" />
                      <Text style={s.errorBannerText}>
                        Foto buram atau terlalu kecil. Gunakan foto yang lebih jelas.
                      </Text>
                    </View>
                  )}
                  <Text style={s.flowStepNum}>Langkah 1 dari 2</Text>
                  <Text style={s.flowStepTitle}>Upload Foto Wajah</Text>
                  <Text style={s.flowStepDesc}>
                    Upload foto selfie yang jelas. Pastikan wajah terlihat penuh, tidak buram, dan pencahayaan baik.
                  </Text>
                  <View style={s.uploadTips}>
                    {['Wajah terlihat penuh', 'Tidak pakai kacamata hitam', 'Pencahayaan cukup', 'Tidak buram'].map((tip) => (
                      <View key={tip} style={s.uploadTip}>
                        <Ionicons name="checkmark-circle-outline" size={15} color={Colors.success} />
                        <Text style={s.uploadTipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                  <Pressable style={s.uploadBtn} onPress={pickReferencePhoto}>
                    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={s.uploadBtnGrad}>
                      <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
                      <Text style={s.uploadBtnText}>Pilih Foto dari Galeri</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}

              {/* ── Phase: analyzing_ref ── */}
              {facePhase === 'analyzing_ref' && (
                <View style={s.processingBox}>
                  {refPhoto && <Image source={{ uri: refPhoto }} style={s.processingPhoto} />}
                  <View style={s.processingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={s.processingText}>Menganalisis foto...</Text>
                    <Text style={s.processingSubText}>Memeriksa kualitas & mendeteksi wajah</Text>
                  </View>
                </View>
              )}

              {/* ── Phase: ref_ready ── */}
              {facePhase === 'ref_ready' && (
                <View>
                  <View style={s.refReadyRow}>
                    <Image source={{ uri: refPhoto! }} style={s.refPhotoPreview} />
                    <View style={s.refReadyInfo}>
                      <View style={s.refReadyBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                        <Text style={s.refReadyBadgeText}>Foto diterima</Text>
                      </View>
                      <Text style={s.refReadyTitle}>Wajah Terdeteksi</Text>
                      <Text style={s.refReadyDesc}>Foto referensi berhasil dianalisis</Text>
                      <Pressable onPress={retryFromUpload} style={s.changePhotoBtn}>
                        <Ionicons name="refresh" size={14} color={Colors.muted} />
                        <Text style={s.changePhotoText}>Ganti foto</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={s.dividerRow}>
                    <View style={s.divider} />
                    <Text style={s.dividerText}>Langkah 2 dari 2</Text>
                    <View style={s.divider} />
                  </View>

                  <Text style={s.flowStepTitle}>Ambil Selfie Live</Text>
                  <Text style={s.flowStepDesc}>
                    Kamera akan terbuka. Posisikan wajah Anda di dalam oval dan tekan tombol kamera.
                  </Text>
                  <Pressable style={s.uploadBtn} onPress={openCamera}>
                    <LinearGradient colors={['#1877F2', '#0A5FD9']} style={s.uploadBtnGrad}>
                      <Ionicons name="camera" size={22} color="#fff" />
                      <Text style={s.uploadBtnText}>Buka Kamera Selfie</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}

              {/* ── Phase: comparing ── */}
              {facePhase === 'comparing' && (
                <View>
                  <View style={s.compareRow}>
                    <View style={s.comparePhotoWrap}>
                      <Image source={{ uri: refPhoto! }} style={s.comparePhoto} />
                      <Text style={s.comparePhotoLabel}>Referensi</Text>
                    </View>
                    <View style={s.compareVs}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                    </View>
                    <View style={s.comparePhotoWrap}>
                      <Image source={{ uri: livePhoto! }} style={s.comparePhoto} />
                      <View style={s.scanLineWrap}>
                        <Animated.View style={[s.compareScanLine, { transform: [{ translateY: scanTranslateY }] }]} />
                      </View>
                      <Text style={s.comparePhotoLabel}>Live</Text>
                    </View>
                  </View>
                  <Text style={s.processingText}>Membandingkan wajah...</Text>
                  <Text style={s.processingSubText}>Menggunakan teknologi face matching</Text>
                </View>
              )}

              {/* ── Phase: blur_error ── */}
              {facePhase === 'blur_error' && (
                <View>
                  <View style={s.errorBox}>
                    <View style={s.errorIconWrap}>
                      <Ionicons name="eye-off" size={36} color="#FF9F0A" />
                    </View>
                    <Text style={s.errorTitle}>Foto Buram</Text>
                    <Text style={s.errorDesc}>
                      Selfie yang diambil terlalu buram. Pastikan kamera stabil dan pencahayaan cukup.
                    </Text>
                  </View>
                  <View style={s.compareRow}>
                    <View style={s.comparePhotoWrap}>
                      <Image source={{ uri: refPhoto! }} style={s.comparePhoto} />
                      <Text style={s.comparePhotoLabel}>Referensi</Text>
                    </View>
                    <View style={s.compareVs}>
                      <Ionicons name="close-circle" size={28} color="#FF3B30" />
                    </View>
                    <View style={s.comparePhotoWrap}>
                      <View style={[s.comparePhoto, s.blurPlaceholder]}>
                        <Ionicons name="eye-off-outline" size={32} color={Colors.muted} />
                        <Text style={s.blurPlaceholderText}>Buram</Text>
                      </View>
                      <Text style={s.comparePhotoLabel}>Live</Text>
                    </View>
                  </View>
                  <Pressable style={s.retryBtn} onPress={retryFromCamera}>
                    <LinearGradient colors={['#FF9F0A', '#E08800']} style={s.uploadBtnGrad}>
                      <Ionicons name="camera" size={20} color="#fff" />
                      <Text style={s.uploadBtnText}>Ulangi Selfie</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}

              {/* ── Phase: no_match ── */}
              {facePhase === 'no_match' && (
                <View>
                  <View style={s.errorBox}>
                    <View style={s.errorIconWrap}>
                      <Ionicons name="person-remove" size={36} color="#FF3B30" />
                    </View>
                    <Text style={s.errorTitle}>Wajah Tidak Cocok</Text>
                    <Text style={s.errorDesc}>
                      Wajah pada selfie tidak sesuai dengan foto referensi. Pastikan Anda mengambil selfie wajah sendiri.
                    </Text>
                  </View>
                  <View style={s.compareRow}>
                    <View style={s.comparePhotoWrap}>
                      <Image source={{ uri: refPhoto! }} style={s.comparePhoto} />
                      <Text style={s.comparePhotoLabel}>Referensi</Text>
                    </View>
                    <View style={s.compareVs}>
                      <Ionicons name="close-circle" size={28} color="#FF3B30" />
                    </View>
                    <View style={s.comparePhotoWrap}>
                      <View style={[s.comparePhoto, s.blurPlaceholder]}>
                        <Ionicons name="person-remove-outline" size={32} color={Colors.muted} />
                        <Text style={s.blurPlaceholderText}>Tidak cocok</Text>
                      </View>
                      <Text style={s.comparePhotoLabel}>Live</Text>
                    </View>
                  </View>
                  <Pressable style={s.retryBtn} onPress={retryFromCamera}>
                    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={s.uploadBtnGrad}>
                      <Ionicons name="camera" size={20} color="#fff" />
                      <Text style={s.uploadBtnText}>Coba Selfie Lagi</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable onPress={retryFromUpload} style={s.changePhotoBtn2}>
                    <Text style={s.changePhotoText2}>Ganti foto referensi</Text>
                  </Pressable>
                </View>
              )}

              {/* ── Phase: verified ── */}
              {facePhase === 'verified' && (
                <View>
                  <Animated.View style={[s.verifiedBox, { opacity: verifyOpacity, transform: [{ scale: verifyScale }] }]}>
                    <LinearGradient colors={['#1877F2', '#0A5FD9']} style={s.verifiedGrad}>
                      <View style={s.verifiedIconWrap}>
                        <Ionicons name="checkmark-circle" size={52} color="#fff" />
                      </View>
                      <Text style={s.verifiedTitle}>Terverifikasi!</Text>
                      <Text style={s.verifiedSub}>Identitas Anda berhasil dikonfirmasi</Text>
                    </LinearGradient>
                  </Animated.View>

                  <View style={s.compareRow}>
                    <View style={s.comparePhotoWrap}>
                      <Image source={{ uri: refPhoto! }} style={s.comparePhoto} />
                      <Text style={s.comparePhotoLabel}>Referensi</Text>
                    </View>
                    <View style={s.compareVs}>
                      <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                    </View>
                    <View style={s.comparePhotoWrap}>
                      <Image source={{ uri: livePhoto! }} style={s.comparePhoto} />
                      <View style={s.matchBadgeOnPhoto}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      </View>
                      <Text style={s.comparePhotoLabel}>Live</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ══ STEP 2: Profile Photos ══ */}
        {step === 2 && (
          <View>
            <Text style={s.title}>Foto Profil</Text>
            <Text style={s.subtitle}>Tambahkan hingga 6 foto terbaik Anda</Text>
            <View style={s.photosGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={s.photoSlot}>
                  {photos[i] ? (
                    <Pressable style={s.photoFilled} onPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}>
                      <Image source={{ uri: photos[i] }} style={s.photoImg} />
                      <View style={s.removeBtn}><Ionicons name="close" size={14} color="#fff" /></View>
                    </Pressable>
                  ) : (
                    <Pressable style={s.photoEmpty} onPress={i === photos.length ? pickProfilePhoto : undefined}>
                      {i === photos.length && <Ionicons name="add" size={32} color={Colors.primary} />}
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ══ STEP 3: About ══ */}
        {step === 3 && (
          <View>
            <Text style={s.title}>Tentang Kamu</Text>
            <Text style={s.subtitle}>Ceritakan sedikit tentang dirimu</Text>
            <View style={s.field}>
              <Text style={s.label}>Bio</Text>
              <TextInput style={s.bioInput} placeholder="Tulis sesuatu yang menarik..." placeholderTextColor={Colors.muted}
                value={bio} onChangeText={setBio} multiline maxLength={300} textAlignVertical="top" />
              <Text style={s.charCount}>{bio.length}/300</Text>
            </View>
            <View style={s.field}>
              <Text style={s.label}>Usia</Text>
              <View style={s.inputBox}>
                <TextInput style={s.input} value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={2} placeholderTextColor={Colors.muted} />
              </View>
            </View>
          </View>
        )}

        {/* ══ STEP 4: Preferences ══ */}
        {step === 4 && (
          <View>
            <Text style={s.title}>Preferensi</Text>
            <Text style={s.subtitle}>Bantu kami menemukan orang yang tepat untukmu</Text>
            <View style={s.field}>
              <Text style={s.label}>Saya adalah</Text>
              <View style={s.optRow}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <Pressable key={g} style={[s.opt, gender === g && s.optActive]} onPress={() => setGender(g)}>
                    <Text style={[s.optTxt, gender === g && s.optTxtActive]}>{g === 'male' ? 'Pria' : g === 'female' ? 'Wanita' : 'Lainnya'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={s.field}>
              <Text style={s.label}>Mencari</Text>
              <View style={s.optRow}>
                {(['male', 'female', 'both'] as const).map((g) => (
                  <Pressable key={g} style={[s.opt, lookingFor === g && s.optActive]} onPress={() => setLookingFor(g)}>
                    <Text style={[s.optTxt, lookingFor === g && s.optTxtActive]}>{g === 'male' ? 'Pria' : g === 'female' ? 'Wanita' : 'Keduanya'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ══ STEP 5: Interests ══ */}
        {step === 5 && (
          <View>
            <Text style={s.title}>Minat Kamu</Text>
            <Text style={s.subtitle}>Pilih hingga 10 minat (opsional)</Text>
            <View style={s.interestsGrid}>
              {INTERESTS_LIST.map((interest) => {
                const active = interests.includes(interest);
                return (
                  <Pressable key={interest} style={[s.chip, active && s.chipActive]} onPress={() => toggleInterest(interest)}>
                    <Text style={[s.chipTxt, active && s.chipTxtActive]}>{interest}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[s.nextBtn, step === 1 && facePhase !== 'verified' && s.nextBtnDisabled]}
          onPress={goNext}
          disabled={loading || facePhase === 'comparing' || facePhase === 'analyzing_ref' || (step === 1 && facePhase !== 'verified')}
        >
          <LinearGradient
            colors={step === 1 && facePhase !== 'verified' ? ['#333', '#2a2a2a'] : [Colors.primary, Colors.primaryDark]}
            style={s.nextGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={s.nextRow}>
                {step === 1 && facePhase === 'verified' && (
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
                )}
                <Text style={s.nextTxt}>
                  {step === 1 && facePhase !== 'verified'
                    ? 'Selesaikan Verifikasi'
                    : step === TOTAL_STEPS ? 'Mulai!' : 'Lanjut'}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
        {step > 1 && step < TOTAL_STEPS && (
          <Pressable onPress={() => setStep((p) => p + 1)} style={s.skipBtn}>
            <Text style={s.skipTxt}>Lewati untuk sekarang</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#000' },
  root: { flex: 1, backgroundColor: Colors.background },

  // Camera
  camOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  camHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.5)',
  },
  camClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  camTitle: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  camGuideArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  faceOval: {
    width: 220, height: 290, borderRadius: 115,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  corner: { position: 'absolute', width: 22, height: 22, borderColor: '#FF4458', borderWidth: 3 },
  tl: { top: 4, left: 4, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 3 },
  tr: { top: 4, right: 4, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 3 },
  bl: { bottom: 4, left: 4, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 3 },
  br: { bottom: 4, right: 4, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 3 },
  ovalClip: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  scanLine: { height: 2, backgroundColor: 'rgba(255, 68, 88, 0.7)', width: '100%' },
  camInstruction: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 },
  camInstrText: { color: '#fff', fontSize: 15, fontFamily: 'Nunito_700Bold', textAlign: 'center' },
  camInstrSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Nunito_400Regular', textAlign: 'center', marginTop: 3 },
  camFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 36, backgroundColor: 'rgba(0,0,0,0.5)' },
  refThumbWrap: { alignItems: 'center', gap: 4 },
  refThumb: { width: 52, height: 52, borderRadius: 10, borderWidth: 2, borderColor: '#fff' },
  refThumbLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Nunito_600SemiBold' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  captureBtnInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { marginRight: 12 },
  progRow: { flex: 1, flexDirection: 'row', gap: 5 },
  progBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progBarActive: { backgroundColor: Colors.primary },
  stepLabel: { color: Colors.muted, fontSize: 13, fontFamily: 'Nunito_600SemiBold', marginLeft: 10 },

  // Content
  content: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 27, fontFamily: 'Nunito_800ExtraBold', color: Colors.foreground, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginBottom: 20 },

  // KYC tag
  kycTagRow: { marginBottom: 10 },
  kycTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary + '20', borderWidth: 1, borderColor: Colors.primary + '40', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  kycTagText: { color: Colors.primary, fontSize: 11, fontFamily: 'Nunito_700Bold' },

  // Flow card
  flowCard: { backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16 },
  flowStepNum: { color: Colors.muted, fontSize: 12, fontFamily: 'Nunito_600SemiBold', marginBottom: 6 },
  flowStepTitle: { color: Colors.foreground, fontSize: 18, fontFamily: 'Nunito_800ExtraBold', marginBottom: 6 },
  flowStepDesc: { color: Colors.muted, fontSize: 13, fontFamily: 'Nunito_400Regular', lineHeight: 20, marginBottom: 16 },

  // Upload tips
  uploadTips: { gap: 8, marginBottom: 20 },
  uploadTip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadTipText: { color: Colors.foregroundSecondary, fontSize: 13, fontFamily: 'Nunito_400Regular' },

  // Upload button
  uploadBtn: { borderRadius: 14, overflow: 'hidden' },
  retryBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  uploadBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  uploadBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Nunito_700Bold' },

  // Processing
  processingBox: { alignItems: 'center', gap: 0 },
  processingPhoto: { width: 160, height: 160, borderRadius: 16, marginBottom: 16 },
  processingOverlay: { alignItems: 'center', gap: 8 },
  processingText: { color: Colors.foreground, fontSize: 16, fontFamily: 'Nunito_700Bold', textAlign: 'center', marginTop: 8 },
  processingSubText: { color: Colors.muted, fontSize: 13, fontFamily: 'Nunito_400Regular', textAlign: 'center' },

  // Ref ready
  refReadyRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  refPhotoPreview: { width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderColor: Colors.success },
  refReadyInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  refReadyBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  refReadyBadgeText: { color: Colors.success, fontSize: 12, fontFamily: 'Nunito_700Bold' },
  refReadyTitle: { color: Colors.foreground, fontSize: 16, fontFamily: 'Nunito_700Bold' },
  refReadyDesc: { color: Colors.muted, fontSize: 12, fontFamily: 'Nunito_400Regular' },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  changePhotoText: { color: Colors.muted, fontSize: 12, fontFamily: 'Nunito_400Regular' },
  changePhotoBtn2: { alignItems: 'center', paddingVertical: 12 },
  changePhotoText2: { color: Colors.muted, fontSize: 13, fontFamily: 'Nunito_400Regular' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.muted, fontSize: 11, fontFamily: 'Nunito_600SemiBold' },

  // Compare
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginVertical: 16 },
  comparePhotoWrap: { alignItems: 'center', gap: 6 },
  comparePhoto: { width: 110, height: 110, borderRadius: 12, overflow: 'hidden' },
  scanLineWrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 12 },
  compareScanLine: { height: 2, backgroundColor: 'rgba(255,68,88,0.8)', width: '100%' },
  comparePhotoLabel: { color: Colors.muted, fontSize: 11, fontFamily: 'Nunito_600SemiBold' },
  compareVs: { alignItems: 'center', justifyContent: 'center', width: 36 },
  matchBadgeOnPhoto: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12 },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FF9F0A20', borderWidth: 1, borderColor: '#FF9F0A50', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorBannerText: { flex: 1, color: '#FF9F0A', fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  errorBox: { alignItems: 'center', gap: 8, marginBottom: 8 },
  errorIconWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.cardElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  errorTitle: { color: Colors.foreground, fontSize: 18, fontFamily: 'Nunito_800ExtraBold' },
  errorDesc: { color: Colors.muted, fontSize: 13, fontFamily: 'Nunito_400Regular', textAlign: 'center', lineHeight: 20 },
  blurPlaceholder: { backgroundColor: Colors.cardElevated, alignItems: 'center', justifyContent: 'center', gap: 4 },
  blurPlaceholderText: { color: Colors.muted, fontSize: 10, fontFamily: 'Nunito_600SemiBold' },

  // Verified
  verifiedBox: { borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  verifiedGrad: { alignItems: 'center', paddingVertical: 24, gap: 8, paddingHorizontal: 20 },
  verifiedIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  verifiedTitle: { color: '#fff', fontSize: 22, fontFamily: 'Nunito_800ExtraBold' },
  verifiedSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'Nunito_400Regular', textAlign: 'center' },

  // Profile photos
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoSlot: { width: '30.5%', aspectRatio: 3 / 4 },
  photoEmpty: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoFilled: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },

  // Form
  field: { marginBottom: 22 },
  label: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: Colors.foreground, marginBottom: 10 },
  bioInput: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, color: Colors.foreground, fontSize: 15, fontFamily: 'Nunito_400Regular', minHeight: 120 },
  charCount: { textAlign: 'right', color: Colors.muted, fontSize: 12, marginTop: 4, fontFamily: 'Nunito_400Regular' },
  inputBox: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, height: 52, justifyContent: 'center' },
  input: { color: Colors.foreground, fontSize: 16, fontFamily: 'Nunito_400Regular' },
  optRow: { flexDirection: 'row', gap: 10 },
  opt: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  optActive: { backgroundColor: Colors.primary + '25', borderColor: Colors.primary },
  optTxt: { color: Colors.muted, fontSize: 14, fontFamily: 'Nunito_600SemiBold' },
  optTxtActive: { color: Colors.primary },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary + '25', borderColor: Colors.primary },
  chipTxt: { color: Colors.muted, fontSize: 14, fontFamily: 'Nunito_600SemiBold' },
  chipTxtActive: { color: Colors.primary },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'rgba(13,13,13,0.95)', borderTopWidth: 1, borderTopColor: Colors.border },
  nextBtn: { borderRadius: 50, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.5 },
  nextGrad: { paddingVertical: 16, alignItems: 'center' },
  nextRow: { flexDirection: 'row', alignItems: 'center' },
  nextTxt: { color: '#fff', fontSize: 17, fontFamily: 'Nunito_700Bold' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipTxt: { color: Colors.muted, fontSize: 14, fontFamily: 'Nunito_400Regular' },
});
