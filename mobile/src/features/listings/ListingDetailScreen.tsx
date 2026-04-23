import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

type ListingRecord = {
  id: number;
  provider_id: string;
  title: string;
  description: string | null;
  category: string;
  price_cents: number;
};

const EMOJI_MAP: [string, string][] = [
  ['bathroom', '🚿'], ['toilet', '🚽'], ['fridge', '❄️'], ['refrigerator', '❄️'],
  ['packing', '📦'], ['unpack', '📦'], ['party', '🎉'], ['after', '🎉'],
  ['iron', '👔'], ['fold', '👔'], ['window', '🪟'], ['laundry', '🧺'],
  ['wash', '🧺'], ['kitchen', '🍳'], ['cabinet', '🗄️'], ['balcony', '🌿'],
  ['fan', '💨'], ['sofa', '🛋️'], ['carpet', '🪣'], ['bedroom', '🛏️'],
  ['floor', '🧹'], ['deep', '✨'], ['move', '🚛'],
];

function getEmoji(title: string | null | undefined): string {
  if (!title) return '🧹';
  const lower = title.toLowerCase();
  for (const [k, e] of EMOJI_MAP) if (lower.includes(k)) return e;
  return '🧹';
}

const DURATIONS = [
  { label: '1 hr', multiplier: 1 },
  { label: '1.5 hr', multiplier: 1.5 },
  { label: '2 hr', multiplier: 2 },
  { label: '2.5 hr', multiplier: 2.5 },
  { label: '3 hr', multiplier: 3 },
];

const INCLUDES = [
  '✔  Professional cleaner arrives on time',
  '✔  All cleaning supplies included',
  '✔  Background-verified professional',
  '✔  100% satisfaction guarantee',
];

export function ListingDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const params = (route.params as any);
  const listingId = params?.listingId;

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listing, setListing] = useState<ListingRecord | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(0);

  useEffect(() => {
    if (!listingId) { setLoading(false); return; }
    supabase
      .from('listings')
      .select('id, provider_id, title, description, category, price_cents')
      .eq('id', listingId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) Alert.alert('Error', error.message);
        setListing((data as ListingRecord | null) ?? null);
        setLoading(false);
      });
  }, [listingId]);

  const book = async () => {
    if (!user || !listing) return;
    if (user.id === listing.provider_id) {
      Alert.alert('Not allowed', 'You cannot book your own service.');
      return;
    }

    setSubmitting(true);
    const mult = DURATIONS[selectedDuration].multiplier;
    const total = Math.round(listing.price_cents * mult);

    const { error } = await supabase.from('orders').insert({
      customer_id: user.id,
      provider_id: listing.provider_id,
      listing_id: listing.id,
      status: 'requested',
      total_cents: total,
    });

    setSubmitting(false);

    if (error) {
      Alert.alert('Booking failed', error.message);
      return;
    }

    Alert.alert('Booking confirmed! 🎉', 'Your cleaner will arrive shortly.', [
      { text: 'View Bookings', onPress: () => navigation.navigate('BookingsTab') },
      { text: 'OK' },
    ]);
  };

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color="#0f766e" size="large" /></View>;
  }

  if (!listing) {
    return <View style={s.centered}><Text style={s.notFound}>Service not found.</Text></View>;
  }

  const basePrice = Math.round(listing.price_cents / 100);
  const origPrice = Math.round(basePrice * 3.2);
  const mult = DURATIONS[selectedDuration].multiplier;
  const totalPrice = Math.round(basePrice * mult);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroEmojiBox}>
            <Text style={s.heroEmoji}>{getEmoji(listing.title)}</Text>
          </View>
          <View style={s.heroInfo}>
            <View style={s.ratingRow}>
              <Text style={s.stars}>⭐ 4.9</Text>
              <Text style={s.ratingCount}> (12.4k reviews)</Text>
            </View>
            <Text style={s.title}>{listing.title}</Text>
            <Text style={s.category}>{listing.category}</Text>
            <View style={s.priceRow}>
              <Text style={s.price}>₹{basePrice}</Text>
              <Text style={s.origPrice}> ₹{origPrice}</Text>
              <View style={s.discountBadge}>
                <Text style={s.discountText}>{Math.round((1 - basePrice / origPrice) * 100)}% OFF</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {listing.description ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>About this service</Text>
            <Text style={s.desc}>{listing.description}</Text>
          </View>
        ) : null}

        {/* What's included */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>What's included</Text>
          {INCLUDES.map(item => (
            <Text key={item} style={s.includeItem}>{item}</Text>
          ))}
        </View>

        {/* Duration selector */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Select duration</Text>
          <Text style={s.sectionSub}>Price scales with duration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {DURATIONS.map((d, i) => (
              <Pressable
                key={d.label}
                style={[s.durationChip, i === selectedDuration && s.durationChipActive]}
                onPress={() => setSelectedDuration(i)}
              >
                <Text style={[s.durationLabel, i === selectedDuration && s.durationLabelActive]}>{d.label}</Text>
                <Text style={[s.durationPrice, i === selectedDuration && s.durationPriceActive]}>
                  ₹{Math.round(basePrice * d.multiplier)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

      </ScrollView>

      {/* Sticky Book Button */}
      <View style={s.stickyBar}>
        <View>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalPrice}>₹{totalPrice}</Text>
        </View>
        <Pressable style={[s.bookBtn, submitting && { opacity: 0.7 }]} onPress={book} disabled={submitting}>
          <Text style={s.bookBtnText}>{submitting ? 'Booking...' : 'Book Now'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: '#64748b', fontSize: 16 },

  hero: { backgroundColor: '#fff', flexDirection: 'row', padding: 16, gap: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroEmojiBox: {
    width: 90, height: 90, borderRadius: 16, backgroundColor: '#e0f2fe',
    alignItems: 'center', justifyContent: 'center',
  },
  heroEmoji: { fontSize: 44 },
  heroInfo: { flex: 1, gap: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  stars: { fontSize: 13, fontWeight: '700', color: '#111827' },
  ratingCount: { fontSize: 12, color: '#64748b' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  category: { fontSize: 13, color: '#64748b', textTransform: 'capitalize' },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  price: { fontSize: 22, fontWeight: '800', color: '#111827' },
  origPrice: { fontSize: 14, color: '#94a3b8', textDecorationLine: 'line-through', alignSelf: 'flex-end' },
  discountBadge: { backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { color: '#15803d', fontWeight: '700', fontSize: 11 },

  section: { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sectionSub: { fontSize: 13, color: '#64748b', marginTop: -4, marginBottom: 0 },
  desc: { color: '#334155', lineHeight: 22, fontSize: 14 },
  includeItem: { color: '#334155', paddingVertical: 5, fontSize: 14 },

  durationChip: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginRight: 10,
    alignItems: 'center', backgroundColor: '#fff', minWidth: 80,
  },
  durationChipActive: { borderColor: '#0f766e', backgroundColor: '#f0fdf4' },
  durationLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  durationLabelActive: { color: '#0f766e' },
  durationPrice: { fontSize: 12, color: '#64748b', marginTop: 2 },
  durationPriceActive: { color: '#0f766e', fontWeight: '600' },

  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28,
  },
  totalLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  totalPrice: { fontSize: 22, fontWeight: '800', color: '#111827' },
  bookBtn: {
    backgroundColor: '#111827', borderRadius: 12,
    paddingHorizontal: 36, paddingVertical: 14,
  },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
