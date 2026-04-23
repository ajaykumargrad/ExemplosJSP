import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

export function ProfileSetupScreen() {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          Alert.alert('Error loading profile', error.message);
          return;
        }

        if (data) {
          setFullName(data.full_name ?? '');
          setPhone(data.phone ?? user.phone ?? '');
        }
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName.trim(),
      phone: phone.trim() || null
    });

    setLoading(false);

    if (error) {
      Alert.alert('Could not save profile', error.message);
      return;
    }

    Alert.alert('Saved', 'Your profile is ready.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.subtitle}>This is required before using listings and orders.</Text>

      <TextInput value={fullName} onChangeText={setFullName} placeholder="Full name" style={styles.input} />
      <TextInput value={phone} onChangeText={setPhone} placeholder="Phone (optional)" style={styles.input} keyboardType="phone-pad" />

      <Pressable style={styles.button} onPress={saveProfile} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save profile'}</Text>
      </Pressable>

      <Pressable onPress={signOut}>
        <Text style={styles.link}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff', gap: 12 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#6b7280', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 },
  button: { backgroundColor: '#111827', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { textAlign: 'center', color: '#111827', fontWeight: '600', marginTop: 8 }
});
