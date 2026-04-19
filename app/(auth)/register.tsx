import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordLongEnough = password.length >= 6;
  const passwordHasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }
    if (name.trim().length < 2) {
      Alert.alert('Name too short', 'Please enter your full name');
      return;
    }
    if (!emailIsValid) {
      Alert.alert('Invalid email', 'Please enter a valid email address');
      return;
    }
    if (!passwordLongEnough || !passwordHasNumber) {
      Alert.alert('Weak password', 'Use at least 6 characters and include a number');
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Password mismatch', 'Please make sure both passwords match');
      return;
    }
    if (!agreed) {
      Alert.alert('Terms', 'Please agree to the terms of service');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0a0515', '#0D0D0D', '#0D0D0D']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.logoCircle}>
              <Ionicons name="flame" size={36} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Spark and find your match</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.noticeCard}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
              <Text style={styles.noticeText}>
                Create your login first. After this, Spark will guide you through profile setup.
              </Text>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={Colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.muted}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                returnKeyType="next"
              />
              <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.muted} />
              </Pressable>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPass}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <Pressable onPress={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeBtn}>
                <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.muted} />
              </Pressable>
            </View>

            <View style={styles.passwordRules}>
              <View style={styles.ruleRow}>
                <Ionicons
                  name={passwordLongEnough ? 'checkmark-circle' : 'ellipse-outline'}
                  size={15}
                  color={passwordLongEnough ? Colors.success : Colors.muted}
                />
                <Text style={[styles.ruleText, passwordLongEnough && styles.ruleTextActive]}>At least 6 characters</Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons
                  name={passwordHasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                  size={15}
                  color={passwordHasNumber ? Colors.success : Colors.muted}
                />
                <Text style={[styles.ruleText, passwordHasNumber && styles.ruleTextActive]}>Includes a number</Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons
                  name={passwordsMatch ? 'checkmark-circle' : 'ellipse-outline'}
                  size={15}
                  color={passwordsMatch ? Colors.success : Colors.muted}
                />
                <Text style={[styles.ruleText, passwordsMatch && styles.ruleTextActive]}>Passwords match</Text>
              </View>
            </View>

            <Pressable style={styles.checkRow} onPress={() => setAgreed(!agreed)}>
              <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkText}>
                I agree to the{' '}
                <Text style={styles.linkText}>Terms of Service</Text>
                {' & '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </Pressable>

            <Pressable style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.registerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerBtnText}>Create Account</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={styles.loginLink}>Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 28 },
  header: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.muted,
    fontFamily: 'Nunito_400Regular',
  },
  form: { width: '100%' },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary + '12',
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    color: Colors.foregroundSecondary,
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 19,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: Colors.foreground,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
  },
  eyeBtn: { padding: 4 },
  passwordRules: {
    backgroundColor: Colors.card,
    borderRadius: Colors.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
  ruleTextActive: {
    color: Colors.foregroundSecondary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkText: {
    flex: 1,
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
  },
  linkText: {
    color: Colors.primary,
    fontFamily: 'Nunito_600SemiBold',
  },
  registerBtn: {
    borderRadius: Colors.radiusFull,
    overflow: 'hidden',
    marginBottom: 24,
  },
  registerGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginText: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
  },
});
