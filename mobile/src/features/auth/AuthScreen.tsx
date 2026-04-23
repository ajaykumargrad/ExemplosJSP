import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '../../lib/supabase';

type Channel = 'email' | 'phone';

export function AuthScreen() {
  const [channel, setChannel] = useState<Channel>('email');
  const [identifier, setIdentifier] = useState('ajaykumargrad@gmail.com');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidIdentifier = useMemo(() => {
    if (channel === 'email') {
      return /.+@.+\..+/.test(identifier);
    }

    return identifier.trim().startsWith('+') && identifier.trim().length >= 10;
  }, [channel, identifier]);

  const sendOtp = async () => {
    if (!isValidIdentifier) {
      Alert.alert('Invalid input', channel === 'email' ? 'Enter a valid email address.' : 'Use E.164 format, e.g. +15551234567');
      return;
    }

    setLoading(true);

    const payload = channel === 'email' ? { email: identifier.trim() } : { phone: identifier.trim() };
    const { error } = await supabase.auth.signInWithOtp(payload);

    setLoading(false);

    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }

    setOtpSent(true);
    Alert.alert('Code sent', 'Check your inbox/SMS for the 6-digit code.');
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Missing code', 'Please enter the OTP code.');
      return;
    }

    setLoading(true);

    const payload =
      channel === 'email'
        ? { email: identifier.trim(), token: otp.trim(), type: 'email' as const }
        : { phone: identifier.trim(), token: otp.trim(), type: 'sms' as const };

    const { error } = await supabase.auth.verifyOtp(payload);
    setLoading(false);

    if (error) {
      Alert.alert('Verification failed', error.message);
      return;
    }

    Alert.alert('Welcome', 'Signed in successfully.');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>PRONTO</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in with email or phone OTP to continue</Text>

        <View style={styles.segmented}>
          <Pressable style={[styles.segment, channel === 'email' && styles.segmentActive]} onPress={() => setChannel('email')}>
            <Text style={[styles.segmentText, channel === 'email' && styles.segmentTextActive]}>Email</Text>
          </Pressable>
          <Pressable style={[styles.segment, channel === 'phone' && styles.segmentActive]} onPress={() => setChannel('phone')}>
            <Text style={[styles.segmentText, channel === 'phone' && styles.segmentTextActive]}>Phone</Text>
          </Pressable>
        </View>

        <TextInput
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={channel === 'email' ? 'you@example.com' : '+15551234567'}
          autoCapitalize="none"
          keyboardType={channel === 'email' ? 'email-address' : 'phone-pad'}
          style={styles.input}
        />

        {otpSent && <TextInput value={otp} onChangeText={setOtp} placeholder="Enter 6-digit OTP" keyboardType="number-pad" style={styles.input} />}

        {!otpSent ? (
          <Pressable style={styles.button} onPress={sendOtp} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.button} onPress={verifyOtp} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
  eyebrow: { color: '#0f766e', fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#6b7280', marginBottom: 8 },
  segmented: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  segmentActive: { backgroundColor: '#111827', borderColor: '#111827' },
  segmentText: { color: '#111827', fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 },
  button: { backgroundColor: '#111827', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700' }
});
