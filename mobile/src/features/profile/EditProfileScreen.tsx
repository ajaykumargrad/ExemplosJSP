import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

export function EditProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? '');
          setPhone(data.phone ?? user?.phone ?? '');
        }
      });
  }, [user]);

  const save = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }

    setSaving(true);

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user!.id,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
    });

    if (profileError) {
      setSaving(false);
      Alert.alert('Save failed', profileError.message);
      return;
    }

    if (email.trim() && email.trim() !== user?.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: email.trim() });
      if (emailError) {
        setSaving(false);
        Alert.alert('Email update failed', emailError.message);
        return;
      }
    }

    await refreshProfile();
    setSaving(false);
    Alert.alert('Profile updated', 'Your changes have been saved.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const initial = fullName[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f8fafc' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarLetter}>{initial}</Text>
          </View>
          <Text style={s.avatarHint}>Tap to change photo (coming soon)</Text>
        </View>

        {/* Fields */}
        <View style={s.form}>
          <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Enter your full name" autoCapitalize="words" />
          <Field label="Phone number" value={phone} onChange={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
          <Field
            label="Email address"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            hint={email !== user?.email ? 'A verification link will be sent to your new email.' : undefined}
          />
        </View>

        <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save changes'}</Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType, autoCapitalize, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  hint?: string;
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={f.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
      {hint ? <Text style={f.hint}>{hint}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48, gap: 20 },

  avatarWrap: { alignItems: 'center', marginTop: 8, marginBottom: 4, gap: 8 },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#cbd5e1',
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: '#111827' },
  avatarHint: { fontSize: 12, color: '#94a3b8' },

  form: { gap: 4 },

  saveBtn: {
    backgroundColor: '#111827', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

const f = StyleSheet.create({
  wrap: { gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, padding: 14, fontSize: 15, color: '#111827',
  },
  hint: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
