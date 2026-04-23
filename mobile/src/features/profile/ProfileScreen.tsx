import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

type Profile = { full_name: string | null; phone: string | null };

type MenuItem = {
  icon: string;
  label: string;
  badge?: string;
  onPress: () => void;
  danger?: boolean;
};

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<Profile>({ full_name: null, phone: null });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  const displayName = profile.full_name || user?.email?.split('@')[0] || 'User';
  const displayPhone = profile.phone || user?.phone || '';

  const topCards = [
    { icon: '📋', label: 'My\nbookings', onPress: () => navigation.navigate('BookingsTab') },
    { icon: '🎧', label: 'Help &\nSupport', onPress: () => {} },
  ];

  const requestDeletion = () => {
    Alert.alert(
      'Delete account?',
      'This will permanently delete your account, bookings and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type "DELETE" in your mind and confirm. Your account will be removed immediately.',
              [
                { text: 'No, keep my account', style: 'cancel' },
                {
                  text: 'Delete permanently',
                  style: 'destructive',
                  onPress: async () => {
                    const { error } = await supabase.rpc('delete_own_account');
                    if (error) {
                      Alert.alert('Error', error.message);
                      return;
                    }
                    await signOut();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    { icon: '🎁', label: 'Refer & earn', badge: 'Upto ₹100', onPress: () => navigation.navigate('Refer') },
    { icon: '📖', label: 'Saved addresses', onPress: () => navigation.navigate('SavedAddresses') },
    { icon: 'ℹ️', label: 'About us', onPress: () => {} },
    { icon: '📋', label: 'Terms of services', onPress: () => {} },
    { icon: '🔒', label: 'Privacy policy', onPress: () => {} },
    { icon: '🗑️', label: 'Request account deletion', danger: true, onPress: requestDeletion },
    {
      icon: '🚪', label: 'Log out', danger: true,
      onPress: () => Alert.alert(
        'Log out',
        'Are you sure you want to log out?',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: signOut }]
      ),
    },
  ];

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

      {/* ── Swiggy-style Header ── */}
      <View style={s.header}>
        <SafeAreaView>
          <Text style={s.headerTitle}>Profile</Text>
        </SafeAreaView>
        <View style={s.avatarWrap}>
          {/* Outer ring */}
          <View style={s.avatarRing}>
            <View style={s.avatarCircle}>
              {/* Swiggy-style person silhouette */}
              <View style={s.silhouetteHead} />
              <View style={s.silhouetteBody} />
            </View>
          </View>
        </View>
        <Text style={s.headerName}>{displayName}</Text>
        {displayPhone ? <Text style={s.headerSub}>{displayPhone}</Text> : null}
        {user?.email ? <Text style={s.headerEmail}>{user.email}</Text> : null}
        <Pressable onPress={() => navigation.navigate('EditProfile')} style={s.editBtn}>
          <Text style={s.editBtnText}>Edit profile  ›</Text>
        </Pressable>
      </View>

      {/* ── Top Cards ── */}
      <View style={s.cardsRow}>
        {topCards.map(c => (
          <Pressable key={c.label} style={s.card} onPress={c.onPress}>
            <Text style={s.cardIcon}>{c.icon}</Text>
            <Text style={s.cardLabel}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── Menu Items ── */}
      <View style={s.menuSection}>
        {menuItems.map((item, i) => (
          <Pressable
            key={item.label}
            style={[s.menuRow, i < menuItems.length - 1 && s.menuBorder]}
            onPress={item.onPress}
          >
            <Text style={s.menuIcon}>{item.icon}</Text>
            <Text style={[s.menuLabel, item.danger && s.menuLabelDanger]}>{item.label}</Text>
            {item.badge ? (
              <View style={s.badge}>
                <Text style={s.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
            <Text style={[s.chevron, item.danger && { color: '#b91c1c' }]}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* ── App Version ── */}
      <Text style={s.version}>APP VERSION: 1.0.0</Text>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  // Header — Swiggy style
  header: {
    backgroundColor: '#1f8fda',
    alignItems: 'center',
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: '#fff',
    alignSelf: 'flex-start', marginBottom: 20,
  },
  avatarWrap: { marginBottom: 14 },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#1886bd',
    alignItems: 'center', justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  // Person silhouette inside avatar
  silhouetteHead: {
    position: 'absolute', top: 14,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#78909c',
  },
  silhouetteBody: {
    width: 52, height: 34, borderTopLeftRadius: 26,
    borderTopRightRadius: 26, backgroundColor: '#78909c',
  },
  headerName: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 3, textAlign: 'center' },
  headerEmail: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, textAlign: 'center' },
  editBtn: {
    marginTop: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6,
  },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Top cards
  cardsRow: { flexDirection: 'row', gap: 12, padding: 16 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardIcon: { fontSize: 28 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },

  // Menu
  menuSection: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14,
    borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    paddingHorizontal: 16, gap: 12,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  menuLabelDanger: { color: '#111827' },
  badge: {
    backgroundColor: '#fef3c7', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#92400e' },
  chevron: { fontSize: 20, color: '#94a3b8', fontWeight: '300' },

  // Version
  version: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 32, fontWeight: '500' },
});
