import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';

const W = Dimensions.get('window').width;
const CARD_W = (W - 32 - 16) / 3;

type Listing = {
  id: number;
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
  ['fan', '💨'], ['sofa', '🛋️'], ['carpet', '🪣'], ['pest', '🪲'],
  ['bedroom', '🛏️'], ['floor', '🧹'], ['deep', '✨'], ['move', '🚛'],
];

function getEmoji(title: string | null | undefined): string {
  if (!title) return '🧹';
  const lower = title.toLowerCase();
  for (const [k, e] of EMOJI_MAP) if (lower.includes(k)) return e;
  return '🧹';
}

function fakeRating(id: number) {
  const stars = [4.8, 4.9, 5.0, 4.7, 4.9, 5.0, 4.8, 4.9, 4.7, 5.0];
  const counts = ['25.2k', '3.7k', '3k', '18.7k', '4.2k', '8.9k', '5.7k', '6.9k', '3.3k', '6.8k'];
  return { stars: stars[id % stars.length], count: counts[id % counts.length] };
}

const BANNERS = [
  { id: 1, title: 'Super Savings!', line1: 'Up to 80% OFF', line2: 'on first 3 bookings', bg: '#0f766e' },
  { id: 2, title: 'Book in 60 secs', line1: 'Verified cleaners', line2: 'at your doorstep', bg: '#111827' },
  { id: 3, title: 'Refer & Earn ₹100', line1: 'Share with friends,', line2: 'earn rewards instantly', bg: '#1d4ed8' },
];

const HOURLY = [
  { hours: 0.5, price: 39, orig: 125 },
  { hours: 1, price: 79, orig: 250 },
  { hours: 1.5, price: 119, orig: 375 },
  { hours: 2, price: 149, orig: 500 },
  { hours: 2.5, price: 189, orig: 625 },
];

const TRUST = [
  { icon: '✅', title: 'Verified Professionals', sub: 'You Can Trust' },
  { icon: '🏅', title: 'Well Trained', sub: 'to deliver great service' },
  { icon: '🔒', title: 'Safe, reliable,', sub: 'and consistent every time' },
];

const FAQS = [
  { q: 'Can I book a recurring service?', a: 'Yes! You can set up weekly or monthly recurring bookings from the Book for Later section.' },
  { q: 'How can I trust your service?', a: 'All professionals are background-verified, trained, and rated by real customers.' },
  { q: 'Do I need to provide cleaning equipment?', a: 'No, our team brings all equipment and supplies needed.' },
  { q: 'How are the prices calculated?', a: 'Prices are based on service type and duration. You pay only for what you book.' },
  { q: 'How do I contact support?', a: 'Chat with us in-app or call our support line 9am–9pm, 7 days a week.' },
  { q: 'Is there a damage policy?', a: 'Yes, we offer full coverage for any accidental damage caused during service.' },
];

export function HomeFeedScreen() {
  const navigation = useNavigation<any>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const bannerRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('id, title, description, category, price_cents')
      .eq('is_active', true)
      .limit(50);
    setListings((data as Listing[]) ?? []);
  };

  useEffect(() => {
    fetchListings().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setBannerIndex(i => {
        const next = (i + 1) % BANNERS.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timerRef.current);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color="#0f766e" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLoc}>Home ∨</Text>
          <Text style={s.headerAddr} numberOfLines={1}>Your current location</Text>
        </View>
        <View style={s.headerRight}>
          <View style={s.giftBox}>
            <Text style={{ fontSize: 16 }}>🎁</Text>
            <Text style={s.giftAmt}>₹100</Text>
          </View>
          <View style={s.avatar}>
            <Text style={{ fontSize: 22 }}>👤</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f766e" />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Banner Carousel ── */}
        <FlatList
          ref={bannerRef}
          data={BANNERS}
          horizontal
          pagingEnabled
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={b => b.id.toString()}
          onMomentumScrollEnd={e => {
            setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / W));
          }}
          renderItem={({ item }) => (
            <View style={[s.banner, { backgroundColor: item.bg }]}>
              <View style={s.bannerContent}>
                <Text style={s.bannerTitle}>{item.title}</Text>
                <Text style={s.bannerLine}>{item.line1}</Text>
                <Text style={s.bannerLine}>{item.line2}</Text>
                <Pressable style={s.bannerBtn}>
                  <Text style={s.bannerBtnText}>BOOK NOW</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
        <View style={s.dots}>
          {BANNERS.map((_, i) => (
            <View key={i} style={[s.dot, i === bannerIndex && s.dotActive]} />
          ))}
        </View>

        {/* ── Instant House Help ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Instant House Help</Text>
          <Text style={s.sectionSub}>
            At your doorstep in <Text style={s.accentText}>15 mins ⚡</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
            {HOURLY.map(slot => (
              <Pressable
                key={slot.hours}
                style={s.hourCard}
                onPress={() => listings[0] && navigation.navigate('ListingDetail', { listingId: listings[0].id })}
              >
                <Text style={s.hourDuration}>{slot.hours} hr</Text>
                <View style={s.hourPriceRow}>
                  <Text style={s.hourPrice}>₹{slot.price}</Text>
                  <Text style={s.hourOrig}> ₹{slot.orig}</Text>
                </View>
                <Text style={s.hourSave}>Save ₹{slot.orig - slot.price}</Text>
                <View style={s.hourBookBtn}>
                  <Text style={s.hourBookBtnText}>BOOK</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Book for Later ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Book for Later</Text>
          <Text style={s.sectionSub}>Select your slot & stay worry-free</Text>
          <View style={s.laterRow}>
            <Pressable style={s.laterCard}>
              <Text style={s.laterEmoji}>⏰</Text>
              <Text style={s.laterTitle}>Schedule{'\n'}Booking</Text>
              <View style={s.offerBadge}>
                <Text style={s.offerBadgeText}>UP TO 50% OFF</Text>
              </View>
            </Pressable>
            <View style={[s.laterCard, s.laterCardDim]}>
              <Text style={s.laterEmoji}>📅</Text>
              <Text style={[s.laterTitle, { color: '#94a3b8' }]}>Recurring{'\n'}Booking</Text>
              <View style={s.unavailBadge}>
                <Text style={s.unavailBadgeText}>UNAVAILABLE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── All Services Grid ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>All house help services</Text>
          <Text style={s.sectionSub}>
            At your doorstep in <Text style={s.accentText}>15 mins ⚡</Text>
          </Text>
          {listings.length === 0 ? (
            <Text style={s.empty}>No services available right now.</Text>
          ) : (
            <View style={s.grid}>
              {listings.map(item => {
                const { stars, count } = fakeRating(item.id);
                const origPrice = Math.round((item.price_cents * 3.2) / 100);
                const isNew = item.id % 7 === 0;
                return (
                  <Pressable
                    key={item.id}
                    style={[s.serviceCard, { width: CARD_W }]}
                    onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
                  >
                    {isNew && (
                      <View style={s.newBadge}>
                        <Text style={s.newBadgeText}>NEW</Text>
                      </View>
                    )}
                    <View style={s.ratingBadge}>
                      <Text style={s.ratingText}>⭐ {stars} ({count})</Text>
                    </View>
                    <View style={s.emojiBox}>
                      <Text style={s.serviceEmoji}>{getEmoji(item.title)}</Text>
                    </View>
                    <Pressable style={s.addBtn} onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}>
                      <Text style={s.addBtnText}>+</Text>
                    </Pressable>
                    <Text style={s.serviceTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={s.servicePriceRow}>
                      <Text style={s.servicePrice}>₹{Math.round(item.price_cents / 100)}</Text>
                      <Text style={s.serviceOrigPrice}> ₹{origPrice}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Reliable & Trustworthy ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Reliable & Trustworthy</Text>
          <Text style={s.sectionSub}>Ensuring integrity through verified standards</Text>
          <View style={s.trustRow}>
            {TRUST.map(t => (
              <View key={t.title} style={s.trustCard}>
                <View style={s.trustIconBox}>
                  <Text style={{ fontSize: 32 }}>{t.icon}</Text>
                </View>
                <Text style={s.trustTitle}>{t.title}</Text>
                <Text style={s.trustSub}>{t.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── FAQs ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>FAQs</Text>
          <View style={{ marginTop: 8 }}>
            {FAQS.map((faq, i) => (
              <Pressable
                key={i}
                style={s.faqItem}
                onPress={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <View style={s.faqRow}>
                  <Text style={s.faqQ}>{faq.q}</Text>
                  <Text style={s.faqToggle}>{openFaq === i ? '−' : '+'}</Text>
                </View>
                {openFaq === i && <Text style={s.faqA}>{faq.a}</Text>}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 24, fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerLoc: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerAddr: { fontSize: 12, color: '#64748b', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  giftBox: {
    backgroundColor: '#f0fdf4', borderRadius: 24, paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0',
  },
  giftAmt: { fontSize: 10, fontWeight: '800', color: '#0f766e', marginTop: 1 },
  avatar: { backgroundColor: '#f1f5f9', borderRadius: 24, padding: 8 },

  // Banner
  banner: { width: W, height: 200, justifyContent: 'flex-end', padding: 24 },
  bannerContent: { gap: 2 },
  bannerTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  bannerLine: { color: 'rgba(255,255,255,0.88)', fontSize: 15, fontWeight: '500' },
  bannerBtn: {
    marginTop: 12, backgroundColor: '#fff', borderRadius: 8,
    paddingVertical: 9, paddingHorizontal: 20, alignSelf: 'flex-start',
  },
  bannerBtnText: { color: '#111827', fontWeight: '800', fontSize: 13 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: '#fff' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1' },
  dotActive: { width: 18, backgroundColor: '#0f766e' },

  // Section
  section: { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  sectionSub: { color: '#64748b', fontSize: 13, marginTop: 3 },
  accentText: { color: '#0f766e', fontWeight: '700' },

  // Hourly
  hourCard: {
    backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, marginRight: 10,
    minWidth: 130, borderWidth: 1, borderColor: '#d1fae5',
  },
  hourDuration: { fontSize: 20, fontWeight: '700', color: '#111827' },
  hourPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  hourPrice: { fontSize: 17, fontWeight: '700', color: '#111827' },
  hourOrig: { fontSize: 13, color: '#94a3b8', textDecorationLine: 'line-through' },
  hourSave: { color: '#0f766e', fontWeight: '600', fontSize: 12, marginTop: 2 },
  hourBookBtn: {
    marginTop: 12, borderWidth: 1.5, borderColor: '#0f766e',
    borderRadius: 8, paddingVertical: 7, alignItems: 'center',
  },
  hourBookBtnText: { color: '#0f766e', fontWeight: '700', fontSize: 13 },

  // Book for Later
  laterRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  laterCard: {
    flex: 1, backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#d1fae5', gap: 6,
  },
  laterCardDim: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  laterEmoji: { fontSize: 32 },
  laterTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  offerBadge: {
    backgroundColor: '#0f766e', borderRadius: 4, paddingHorizontal: 6,
    paddingVertical: 3, alignSelf: 'flex-start',
  },
  offerBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  unavailBadge: {
    backgroundColor: '#e2e8f0', borderRadius: 4, paddingHorizontal: 6,
    paddingVertical: 3, alignSelf: 'flex-start',
  },
  unavailBadgeText: { color: '#64748b', fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  serviceCard: {
    backgroundColor: '#f8fafc', borderRadius: 12, padding: 8,
    borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden',
  },
  newBadge: {
    position: 'absolute', top: 0, left: 0, backgroundColor: '#dc2626',
    borderTopLeftRadius: 12, borderBottomRightRadius: 8, paddingHorizontal: 6, paddingVertical: 2, zIndex: 2,
  },
  newBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  ratingBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8,
    paddingHorizontal: 4, paddingVertical: 1, zIndex: 1,
  },
  ratingText: { fontSize: 7.5, fontWeight: '600', color: '#111827' },
  emojiBox: {
    backgroundColor: '#e0f2fe', borderRadius: 10, height: 72,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  serviceEmoji: { fontSize: 34 },
  addBtn: {
    position: 'absolute', bottom: 58, right: 6,
    backgroundColor: '#fff', borderRadius: 12, width: 26, height: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#0f766e', zIndex: 1,
  },
  addBtnText: { color: '#0f766e', fontWeight: '800', fontSize: 18, lineHeight: 22 },
  serviceTitle: { fontSize: 11, fontWeight: '600', color: '#111827', minHeight: 30, lineHeight: 15 },
  servicePriceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 2 },
  servicePrice: { fontSize: 13, fontWeight: '700', color: '#111827' },
  serviceOrigPrice: { fontSize: 10, color: '#94a3b8', textDecorationLine: 'line-through' },

  // Trust
  trustRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  trustCard: { flex: 1, alignItems: 'center', gap: 6 },
  trustIconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center',
  },
  trustTitle: { fontSize: 12, fontWeight: '700', textAlign: 'center', color: '#111827' },
  trustSub: { fontSize: 11, color: '#64748b', textAlign: 'center' },

  // FAQ
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 14 },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 14, fontWeight: '500', flex: 1, paddingRight: 12, color: '#111827' },
  faqToggle: { fontSize: 22, color: '#94a3b8', fontWeight: '300' },
  faqA: { marginTop: 8, color: '#64748b', lineHeight: 20, fontSize: 13 },
});
