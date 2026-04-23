import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

type Address = {
  id: number;
  label: string;
  address: string;
  created_at: string;
};

const LABEL_PRESETS = ['Home', 'Work', 'Parents', 'Other'];

export function SavedAddressesScreen() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [label, setLabel] = useState('Home');
  const [addressText, setAddressText] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_addresses')
      .select('id, label, address, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setAddresses((data as Address[]) ?? []);
  }, [user]);

  useEffect(() => {
    fetch().finally(() => setLoading(false));
  }, [fetch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  };

  const openAdd = () => {
    setLabel('Home');
    setAddressText('');
    setModalVisible(true);
  };

  const saveAddress = async () => {
    if (!addressText.trim()) {
      Alert.alert('Address required', 'Please enter an address.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('saved_addresses').insert({
      user_id: user!.id,
      label: label.trim(),
      address: addressText.trim(),
    });
    setSaving(false);
    if (error) { Alert.alert('Save failed', error.message); return; }
    setModalVisible(false);
    await fetch();
  };

  const deleteAddress = (item: Address) => {
    Alert.alert(
      'Remove address',
      `Remove "${item.label}" from saved addresses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            await supabase.from('saved_addresses').delete().eq('id', item.id);
            await fetch();
          },
        },
      ]
    );
  };

  const labelIcon: Record<string, string> = {
    Home: '🏠', Work: '💼', Parents: '👨‍👩‍👧', Other: '📍',
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Add Address Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={s.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Add new address</Text>

            <Text style={s.fieldLabel}>Label</Text>
            <View style={s.presetRow}>
              {LABEL_PRESETS.map(p => (
                <Pressable
                  key={p}
                  style={[s.preset, label === p && s.presetActive]}
                  onPress={() => setLabel(p)}
                >
                  <Text style={[s.presetText, label === p && s.presetTextActive]}>
                    {labelIcon[p] ?? '📍'} {p}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.fieldLabel}>Full address</Text>
            <TextInput
              style={s.input}
              value={addressText}
              onChangeText={setAddressText}
              placeholder="Flat no, building, area, city..."
              multiline
              numberOfLines={3}
            />

            <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={saveAddress} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save address'}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <FlatList
        data={addresses}
        keyExtractor={item => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111827" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>📍</Text>
              <Text style={s.emptyTitle}>No saved addresses</Text>
              <Text style={s.emptySub}>Add your home, work or other frequent locations for faster booking.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardLeft}>
              <Text style={s.cardIcon}>{labelIcon[item.label] ?? '📍'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardLabel}>{item.label}</Text>
                <Text style={s.cardAddr} numberOfLines={2}>{item.address}</Text>
              </View>
            </View>
            <Pressable style={s.deleteBtn} onPress={() => deleteAddress(item)}>
              <Text style={s.deleteBtnText}>🗑️</Text>
            </Pressable>
          </View>
        )}
      />

      {/* Add button */}
      <View style={s.footer}>
        <Pressable style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Add new address</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, gap: 12 },
  handle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  presetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  preset: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f8fafc' },
  presetActive: { backgroundColor: '#111827', borderColor: '#111827' },
  presetText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  presetTextActive: { color: '#fff' },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 13, fontSize: 15, backgroundColor: '#f8fafc',
    textAlignVertical: 'top', minHeight: 80,
  },
  saveBtn: { backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // List
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', maxWidth: 260 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon: { fontSize: 24, marginTop: 2 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardAddr: { fontSize: 13, color: '#64748b', marginTop: 2, lineHeight: 18 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 20 },

  footer: { backgroundColor: '#fff', padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  addBtn: { backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
