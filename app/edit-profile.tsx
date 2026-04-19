import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';

const INTERESTS_LIST = [
  'Travel', 'Coffee', 'Music', 'Yoga', 'Fitness', 'Cooking', 'Art',
  'Photography', 'Movies', 'Books', 'Gaming', 'Hiking', 'Dancing',
  'Foodie', 'Nature', 'Sports', 'Meditation', 'Fashion', 'Tech',
  'Dogs', 'Cats', 'Wine', 'Cycling', 'Swimming', 'Climbing',
  'Reading', 'Writing', 'Entrepreneurship', 'Investing',
];

const GENDERS = ['Man', 'Woman', 'Non-binary', 'Other'];
const LOOKING_FOR = ['Woman', 'Man', 'Everyone'];
const SMOKING_OPTS = ['Never', 'Socially', 'Regularly'];
const DRINKING_OPTS = ['Never', 'Socially', 'Regularly'];
const WORKOUT_OPTS = ['Never', 'Sometimes', 'Often', 'Daily'];
const EDUCATION_OPTS = ['High School', 'Some College', "Bachelor's", "Master's", 'PhD'];

function computeProgress(
  name: string,
  age: number,
  gender: string,
  photos: string[],
  bio: string,
  interests: string[],
  location: string,
  lifestyle: Record<string, string>,
): number {
  let score = 0;
  if (name.trim().length > 0) score += 10;
  if (age >= 18) score += 10;
  if (gender) score += 10;
  if (photos.length >= 2) score += 15;
  if (bio.trim().length >= 20) score += 15;
  if (interests.length >= 3) score += 15;
  if (location.trim().length > 0) score += 10;
  if (Object.values(lifestyle).some(Boolean)) score += 15;
  return score;
}

function ChipSelector({
  options,
  value,
  onSelect,
  multi,
  max,
}: {
  options: string[];
  value: string | string[];
  onSelect: (v: string) => void;
  multi?: boolean;
  max?: number;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <View style={chipStyles.wrap}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => {
              if (!multi) {
                onSelect(opt);
                return;
              }
              if (active) {
                onSelect(opt);
              } else {
                if (max && selected.length >= max) return;
                onSelect(opt);
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[chipStyles.chip, active && chipStyles.chipActive]}
          >
            <Text style={[chipStyles.chipTxt, active && chipStyles.chipTxtActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <View style={stepStyles.row}>
      <Text style={stepStyles.label}>{label}</Text>
      <View style={stepStyles.ctrl}>
        <Pressable
          onPress={() => { if (value > min) { onChange(value - 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
          style={stepStyles.btn}
        >
          <Ionicons name="remove" size={18} color={value > min ? Colors.foreground : Colors.muted} />
        </Pressable>
        <Text style={stepStyles.val}>{value}{unit}</Text>
        <Pressable
          onPress={() => { if (value < max) { onChange(value + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
          style={stepStyles.btn}
        >
          <Ionicons name="add" size={18} color={value < max ? Colors.foreground : Colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [name, setName] = useState(user?.name ?? '');
  const [age, setAge] = useState(user?.age ?? 25);
  const [gender, setGender] = useState(user?.gender ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [photos, setPhotos] = useState<string[]>(user?.photos ?? []);
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [location, setLocation] = useState(user?.location ?? '');
  const [lookingFor, setLookingFor] = useState(user?.lookingFor ?? '');
  const [targetAgeMin, setTargetAgeMin] = useState(user?.targetAgeMin ?? 18);
  const [targetAgeMax, setTargetAgeMax] = useState(user?.targetAgeMax ?? 45);
  const [maxDistance, setMaxDistance] = useState(user?.maxDistance ?? 50);
  const [lifestyle, setLifestyle] = useState<Record<string, string>>({
    smoking: user?.lifestyle?.smoking ?? '',
    drinking: user?.lifestyle?.drinking ?? '',
    workout: user?.lifestyle?.workout ?? '',
    education: user?.lifestyle?.education ?? '',
  });

  const topPad = Platform.OS === 'web' ? 20 : insets.top;
  const BIO_MAX = 160;

  const progress = computeProgress(name, age, gender, photos, bio, interests, location, lifestyle);

  const progressColor = progress >= 80 ? Colors.success : progress >= 50 ? Colors.gold : Colors.primary;

  const pickPhoto = async () => {
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

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const movePhotoUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...photos];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setPhotos(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const setCoverPhoto = (idx: number) => {
    if (idx === 0) return;
    const next = [...photos];
    const [photo] = next.splice(idx, 1);
    next.unshift(photo);
    setPhotos(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const detectLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Enable location permission to auto-detect your city.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync(pos.coords);
      if (geo) {
        const city = geo.city || geo.subregion || geo.region || '';
        const country = geo.country || '';
        setLocation(city && country ? `${city}, ${country}` : city || country);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not detect location. Enter manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= 10) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return prev;
      }
      return [...prev, interest];
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nama wajib diisi');
      return;
    }
    setSaving(true);
    await updateProfile({
      name: name.trim(),
      age,
      gender,
      bio,
      photos,
      interests,
      location,
      lookingFor,
      targetAgeMin,
      targetAgeMax,
      maxDistance,
      lifestyle: {
        smoking: lifestyle.smoking || undefined,
        drinking: lifestyle.drinking || undefined,
        workout: lifestyle.workout || undefined,
        education: lifestyle.education || undefined,
      },
    });
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} style={styles.saveHeaderBtn} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveHeaderTxt}>Save</Text>
          )}
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Profile Completeness</Text>
          <Text style={[styles.progressPct, { color: progressColor }]}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: progressColor }]} />
        </View>
        {progress < 80 && (
          <Text style={styles.progressHint}>
            {progress < 40 ? '🔥 Keep going! Add photos & interests.' : progress < 70 ? '✨ Almost there! Fill in more details.' : '🎉 Looking great! Just a bit more.'}
          </Text>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── PHOTOS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionSub}>Min 2 · First photo is your cover</Text>
          </View>
          <View style={styles.photoGrid}>
            {photos.map((uri, idx) => (
              <View key={`${uri}-${idx}`} style={[styles.photoCard, idx === 0 && styles.coverCard]}>
                <Image source={{ uri }} style={styles.photoImg} />
                {idx === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeTxt}>Cover</Text>
                  </View>
                )}
                <View style={styles.photoActions}>
                  {idx !== 0 && (
                    <Pressable style={styles.photoActionBtn} onPress={() => setCoverPhoto(idx)}>
                      <Ionicons name="star" size={13} color={Colors.gold} />
                    </Pressable>
                  )}
                  {idx !== 0 && (
                    <Pressable style={styles.photoActionBtn} onPress={() => movePhotoUp(idx)}>
                      <Ionicons name="arrow-back" size={13} color={Colors.foreground} />
                    </Pressable>
                  )}
                  <Pressable style={[styles.photoActionBtn, styles.photoRemoveBtn]} onPress={() => removePhoto(idx)}>
                    <Ionicons name="close" size={13} color="#fff" />
                  </Pressable>
                </View>
              </View>
            ))}
            {photos.length < 9 && (
              <Pressable style={styles.addPhotoCard} onPress={pickPhoto}>
                <Ionicons name="add" size={28} color={Colors.muted} />
                <Text style={styles.addPhotoTxt}>Add</Text>
              </Pressable>
            )}
          </View>
          {photos.length < 2 && (
            <View style={styles.warnRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.warning} />
              <Text style={styles.warnTxt}>Add at least 2 photos to boost your profile</Text>
            </View>
          )}
        </View>

        {/* ── BASIC IDENTITY ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>

          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Colors.muted}
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>Age</Text>
          <Stepper label="" value={age} min={18} max={80} onChange={setAge} unit=" yrs" />

          <Text style={styles.fieldLabel}>Gender</Text>
          <ChipSelector options={GENDERS} value={gender} onSelect={setGender} />
        </View>

        {/* ── BIO ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={[styles.sectionSub, bio.length > BIO_MAX * 0.85 && { color: Colors.warning }]}>
              {bio.length}/{BIO_MAX}
            </Text>
          </View>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
            multiline
            textAlignVertical="top"
            placeholder={'Coffee lover ☕ | Night person 🌙\nTell the world who you are...'}
            placeholderTextColor={Colors.muted}
          />
        </View>

        {/* ── INTERESTS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <Text style={[styles.sectionSub, interests.length >= 10 && { color: Colors.warning }]}>
              {interests.length}/10 · min 3
            </Text>
          </View>
          {interests.length < 3 && (
            <View style={styles.warnRow}>
              <Ionicons name="heart-outline" size={14} color={Colors.primary} />
              <Text style={styles.warnTxt}>Pick at least 3 to improve your matches</Text>
            </View>
          )}
          <View style={chipStyles.wrap}>
            {INTERESTS_LIST.map((interest) => {
              const active = interests.includes(interest);
              return (
                <Pressable
                  key={interest}
                  onPress={() => toggleInterest(interest)}
                  style={[chipStyles.chip, active && chipStyles.chipActive]}
                >
                  <Text style={[chipStyles.chipTxt, active && chipStyles.chipTxtActive]}>{interest}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── LOCATION ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Jakarta, Indonesia"
              placeholderTextColor={Colors.muted}
            />
            <Pressable style={styles.gpsBtn} onPress={detectLocation} disabled={gpsLoading}>
              {gpsLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="navigate" size={16} color={Colors.primary} />
                  <Text style={styles.gpsBtnTxt}>GPS</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* ── PREFERENCES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Looking For</Text>
          <ChipSelector options={LOOKING_FOR} value={lookingFor} onSelect={setLookingFor} />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Target Age Range</Text>
          <Stepper label="Min age" value={targetAgeMin} min={18} max={targetAgeMax - 1} onChange={(v) => setTargetAgeMin(v)} unit=" yrs" />
          <Stepper label="Max age" value={targetAgeMax} min={targetAgeMin + 1} max={80} onChange={(v) => setTargetAgeMax(v)} unit=" yrs" />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Max Distance</Text>
          <Stepper label="Distance" value={maxDistance} min={1} max={200} onChange={setMaxDistance} unit=" km" />
        </View>

        {/* ── LIFESTYLE ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>

          <Text style={styles.fieldLabel}>Smoking</Text>
          <ChipSelector
            options={SMOKING_OPTS}
            value={lifestyle.smoking}
            onSelect={(v) => setLifestyle((p) => ({ ...p, smoking: p.smoking === v ? '' : v }))}
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Drinking</Text>
          <ChipSelector
            options={DRINKING_OPTS}
            value={lifestyle.drinking}
            onSelect={(v) => setLifestyle((p) => ({ ...p, drinking: p.drinking === v ? '' : v }))}
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Workout</Text>
          <ChipSelector
            options={WORKOUT_OPTS}
            value={lifestyle.workout}
            onSelect={(v) => setLifestyle((p) => ({ ...p, workout: p.workout === v ? '' : v }))}
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Education</Text>
          <ChipSelector
            options={EDUCATION_OPTS}
            value={lifestyle.education}
            onSelect={(v) => setLifestyle((p) => ({ ...p, education: p.education === v ? '' : v }))}
          />
        </View>

        {/* ── SAVE BUTTON ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable onPress={handleSave} disabled={saving} style={styles.saveBtn}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.saveGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnTxt}>Save Profile</Text>
              )}
            </LinearGradient>
          </Pressable>
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
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: Colors.foreground,
  },
  saveHeaderBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.primary + '20',
    borderRadius: 20,
    minWidth: 60, alignItems: 'center',
  },
  saveHeaderTxt: { color: Colors.primary, fontSize: 15, fontFamily: 'Nunito_700Bold' },

  progressContainer: { paddingHorizontal: 20, marginBottom: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: Colors.muted, fontFamily: 'Nunito_600SemiBold' },
  progressPct: { fontSize: 13, fontFamily: 'Nunito_800ExtraBold' },
  progressTrack: {
    height: 6, backgroundColor: Colors.card, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },
  progressHint: { fontSize: 11, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginTop: 5 },

  section: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: Colors.foreground, marginBottom: 12 },
  sectionSub: { fontSize: 12, color: Colors.muted, fontFamily: 'Nunito_400Regular', marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: Colors.muted, fontFamily: 'Nunito_600SemiBold', marginBottom: 8 },

  input: {
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.foreground,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 12,
  },
  bioInput: { minHeight: 90, textAlignVertical: 'top' },

  locationRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.primary + '18',
    borderRadius: Colors.radius,
    borderWidth: 1, borderColor: Colors.primary + '40',
    minWidth: 72, justifyContent: 'center',
  },
  gpsBtnTxt: { color: Colors.primary, fontSize: 13, fontFamily: 'Nunito_700Bold' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoCard: {
    width: 100, height: 130, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.border,
    position: 'relative',
  },
  coverCard: { borderColor: Colors.primary, borderWidth: 2 },
  photoImg: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.primary + 'CC',
    paddingVertical: 3, alignItems: 'center',
  },
  coverBadgeTxt: { color: '#fff', fontSize: 11, fontFamily: 'Nunito_700Bold' },
  photoActions: {
    position: 'absolute', top: 4, right: 4,
    flexDirection: 'column', gap: 4,
  },
  photoActionBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#000000BB',
    alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveBtn: { backgroundColor: Colors.primary + 'DD' },

  addPhotoCard: {
    width: 100, height: 130, borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoTxt: { color: Colors.muted, fontSize: 12, fontFamily: 'Nunito_600SemiBold' },

  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  warnTxt: { fontSize: 12, color: Colors.muted, fontFamily: 'Nunito_400Regular', flex: 1 },

  saveBtn: { borderRadius: Colors.radiusFull, overflow: 'hidden' },
  saveGrad: { paddingVertical: 15, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
});

const chipStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Colors.radiusFull,
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary,
  },
  chipTxt: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.muted },
  chipTxtActive: { color: Colors.primary },
});

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Colors.radius,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  label: { fontSize: 14, color: Colors.foreground, fontFamily: 'Nunito_400Regular' },
  ctrl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  val: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: Colors.foreground, minWidth: 55, textAlign: 'center' },
});
