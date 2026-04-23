import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

import { supabase } from '../../lib/supabase';

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = (W - 32 - 16) / 3;
const HERO_H = H * 0.42;

type Listing = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  price_cents: number;
};

const EMOJI_MAP: [string, string][] = [
  ['bathroom', '🚿'], ['toilet', '🚽'], ['fridge', '❄️'], ['packing', '📦'],
  ['unpack', '📦'], ['party', '🎉'], ['after', '🎉'], ['iron', '👔'],
  ['fold', '👔'], ['window', '🪟'], ['laundry', '🧺'], ['wash', '🧺'],
  ['kitchen', '🍳'], ['cabinet', '🗄️'], ['balcony', '🌿'], ['fan', '💨'],
  ['sofa', '🛋️'], ['carpet', '🪣'], ['bedroom', '🛏️'], ['floor', '🧹'],
  ['deep', '✨'], ['move', '🚛'], ['pest', '🪲'],
];
function getEmoji(title: string | null | undefined): string {
  if (!title) return '🧹';
  const lower = title.toLowerCase();
  for (const [k, e] of EMOJI_MAP) if (lower.includes(k)) return e;
  return '🧹';
}
function fakeRating(id: number) {
  const s = [4.8, 4.9, 5.0, 4.7, 4.9, 5.0, 4.8, 4.9, 4.7, 5.0];
  const c = ['25.2k', '3.7k', '3k', '18.7k', '4.2k', '8.9k', '5.7k', '6.9k', '3.3k', '6.8k'];
  return { stars: s[id % s.length], count: c[id % c.length] };
}

// ── Offer cards shown in the hero ──
const OFFERS = [
  {
    id: 1,
    tag: '🔥 LIMITED OFFER',
    title: 'Up to 80% OFF',
    sub: 'On your first 3 bookings',
    cta: 'Claim now',
    accent: '#fbbf24',
  },
  {
    id: 2,
    tag: '🆕 JUST ADDED',
    title: 'Kitchen Cabinets',
    sub: 'Deep inside-out clean from ₹597',
    cta: 'Book now',
    accent: '#34d399',
  },
  {
    id: 3,
    tag: '🎁 REFER & EARN',
    title: 'Get ₹100 per friend',
    sub: 'They get ₹50 off their first order',
    cta: 'Share link',
    accent: '#60a5fa',
  },
  {
    id: 4,
    tag: '⚡ INSTANT BOOK',
    title: 'Cleaner in 15 mins',
    sub: '200+ verified pros near you',
    cta: 'Book now',
    accent: '#f472b6',
  },
];

const STATS = [
  { icon: '⚡', value: '15 min', label: 'Arrival' },
  { icon: '👥', value: '200+', label: 'Pros' },
  { icon: '⭐', value: '4.9', label: 'Rating' },
  { icon: '✅', value: '10k+', label: 'Bookings' },
];

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🏠' },
  { id: 'bathroom', label: 'Bathroom', emoji: '🚿' },
  { id: 'kitchen', label: 'Kitchen', emoji: '🍳' },
  { id: 'laundry', label: 'Laundry', emoji: '🧺' },
  { id: 'bedroom', label: 'Bedroom', emoji: '🛏️' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🌿' },
  { id: 'deep', label: 'Deep Clean', emoji: '✨' },
];

const HOURLY = [
  { hours: 0.5, price: 39, orig: 125 },
  { hours: 1, price: 79, orig: 250 },
  { hours: 1.5, price: 119, orig: 375 },
  { hours: 2, price: 149, orig: 500 },
  { hours: 2.5, price: 189, orig: 625 },
];

const TRUST = [
  { icon: '✅', title: 'Verified Pros', sub: 'Background checked' },
  { icon: '🏅', title: 'Well Trained', sub: 'Quality assured' },
  { icon: '🔒', title: 'Safe & Reliable', sub: 'Guaranteed service' },
];

const FAQS = [
  { q: 'Can I book a recurring service?', a: 'Yes! Weekly or monthly recurring bookings available.' },
  { q: 'Do I need to provide cleaning equipment?', a: 'No, our team brings all supplies needed.' },
  { q: 'How are the prices calculated?', a: 'Based on service type and duration. Pay only for what you book.' },
  { q: 'Is there a damage policy?', a: 'Yes, full coverage for any accidental damage during service.' },
];

// ─────────────────────────────────────────────
//  Animated hero character component
// ─────────────────────────────────────────────
const MESSAGES = [
  'Your cleaner arrives in 15 mins! ⚡',
  'Spotless home guaranteed! ✨',
  '200+ verified pros near you 🏅',
  'First booking? Up to 80% OFF! 🎉',
];

function AnimatedHero() {
  // Animations
  const bounce     = useRef(new Animated.Value(0)).current;
  const swing      = useRef(new Animated.Value(0)).current;
  const pulse      = useRef(new Animated.Value(0)).current;
  const bubbleIn   = useRef(new Animated.Value(0)).current;
  const sparkle1   = useRef(new Animated.Value(0)).current;
  const sparkle2   = useRef(new Animated.Value(0)).current;
  const sparkle3   = useRef(new Animated.Value(0)).current;
  const glowScale  = useRef(new Animated.Value(1)).current;
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    // Character bounce
    Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -10, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    // Mop swing
    Animated.loop(Animated.sequence([
      Animated.timing(swing, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(swing, { toValue: -1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();

    // Background glow pulse
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();

    // Glow scale
    Animated.loop(Animated.sequence([
      Animated.timing(glowScale, { toValue: 1.15, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowScale, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    // Sparkles — staggered float up & fade
    const makeSparkle = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        ]),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]));
    makeSparkle(sparkle1, 0).start();
    makeSparkle(sparkle2, 600).start();
    makeSparkle(sparkle3, 1200).start();

    // Speech bubble slide in
    Animated.spring(bubbleIn, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();

    // Cycle messages
    const id = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 3000);
    return () => clearInterval(id);
  }, []);

  const mopRot = swing.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] });

  const makeSparkleStyle = (anim: Animated.Value, x: number, startY: number) => ({
    position: 'absolute' as const,
    left: x, top: startY,
    opacity: anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) }],
  });

  return (
    <View style={ah.container}>
      {/* Background glow rings */}
      <Animated.View style={[ah.ring, ah.ring1, {
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.14] }),
        transform: [{ scale: glowScale }],
      }]} />
      <Animated.View style={[ah.ring, ah.ring2, {
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.10] }),
        transform: [{ scale: glowScale }],
      }]} />

      {/* Sparkles */}
      <Animated.Text style={[ah.sparkle, makeSparkleStyle(sparkle1, 60, 30)]}>✨</Animated.Text>
      <Animated.Text style={[ah.sparkle, makeSparkleStyle(sparkle2, W - 80, 50)]}>⭐</Animated.Text>
      <Animated.Text style={[ah.sparkle, makeSparkleStyle(sparkle3, W / 2 - 10, 20)]}>💫</Animated.Text>

      {/* Character group */}
      <Animated.View style={[ah.characterGroup, { transform: [{ translateY: bounce }] }]}>
        {/* Glow behind character */}
        <Animated.View style={[ah.characterGlow, { transform: [{ scale: glowScale }] }]} />

        {/* Face */}
        <Text style={ah.face}>🧑‍🦱</Text>

        {/* Arms + mop */}
        <Animated.View style={[ah.mopWrap, { transform: [{ rotate: mopRot }] }]}>
          <Text style={ah.mop}>🧹</Text>
        </Animated.View>

        {/* Uniform label */}
        <View style={ah.badge}>
          <Text style={ah.badgeText}>PRONTO</Text>
        </View>
      </Animated.View>

      {/* Floating items around character */}
      <View style={ah.floatLeft}>
        <Text style={{ fontSize: 22 }}>🪣</Text>
      </View>
      <View style={ah.floatRight}>
        <Text style={{ fontSize: 20 }}>🧴</Text>
      </View>

      {/* Speech bubble */}
      <Animated.View style={[ah.bubble, {
        opacity: bubbleIn,
        transform: [
          { scale: bubbleIn.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
          { translateY: bubbleIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
        ],
      }]}>
        <Text style={ah.bubbleText}>{MESSAGES[msgIdx]}</Text>
        <View style={ah.bubbleTail} />
      </Animated.View>

      {/* Shadow under character */}
      <Animated.View style={[ah.shadow, {
        transform: [{ scaleX: bounce.interpolate({ inputRange: [-10, 0], outputRange: [0.7, 1] }) }],
        opacity: bounce.interpolate({ inputRange: [-10, 0], outputRange: [0.2, 0.35] }),
      }]} />
    </View>
  );
}

export function HomeFeedScreen() {
  const navigation = useNavigation<any>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [address, setAddress] = useState('Detecting location...');
  const [locationModal, setLocationModal] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setAddress('Location access denied'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (geo) {
        const line = [geo.name, geo.street, geo.subregion, geo.city].filter(Boolean).slice(0, 2).join(', ');
        setAddress(line || 'Current location');
      }
    } catch { setAddress('Current location'); }
  };

  const fetchListings = async () => {
    const { data } = await supabase.from('listings').select('id, title, description, category, price_cents').eq('is_active', true).limit(50);
    setListings((data as Listing[]) ?? []);
  };

  useEffect(() => { fetchLocation(); fetchListings().finally(() => setLoading(false)); }, []);

  const filteredListings = useMemo(() => {
    if (activeCategory === 'all') return listings;
    return listings.filter(l => l.title.toLowerCase().includes(activeCategory));
  }, [listings, activeCategory]);

  const onRefresh = async () => { setRefreshing(true); await fetchListings(); setRefreshing(false); };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={{ backgroundColor: '#111827' }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ════════════════════════════════════
            HERO — scrolls with content
        ════════════════════════════════════ */}
        <View style={s.hero}>

          {/* Location row */}
          <View style={s.topRow}>
            <Pressable style={s.locationBtn} onPress={() => setLocationModal(true)}>
              <Text style={s.locPin}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.locTitle}>Home  <Text style={s.locCaret}>∨</Text></Text>
                <Text style={s.locAddr} numberOfLines={1}>{address}</Text>
              </View>
            </Pressable>
            <View style={s.headerIcons}>
              <Pressable style={s.iconChip} onPress={() => navigation.navigate('ProfileTab', { screen: 'Refer' })}>
                <Text style={{ fontSize: 16 }}>🎁</Text>
                <Text style={s.iconChipText}>₹100</Text>
              </Pressable>
              <Pressable style={s.avatarChip} onPress={() => navigation.navigate('ProfileTab', { screen: 'Profile' })}>
                <Text style={{ fontSize: 22 }}>👤</Text>
              </Pressable>
            </View>
          </View>

          {/* Animated character hero */}
          <AnimatedHero />

          {/* Stats strip */}
          <View style={s.statsRow}>
            {STATS.map((st, i) => (
              <React.Fragment key={st.label}>
                <View style={s.statItem}>
                  <Text style={s.statIcon}>{st.icon}</Text>
                  <Text style={s.statValue}>{st.value}</Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
                {i < STATS.length - 1 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ════════════════════════════════════
            WHITE CONTENT
        ════════════════════════════════════ */}
        <View style={s.contentWrap}>
          {/* Curved cap */}
          <View style={s.cap} />

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.catScroll}
            contentContainerStyle={s.catScrollInner}
          >
            {CATEGORIES.map(cat => (
              <Pressable key={cat.id} style={s.catItem} onPress={() => setActiveCategory(cat.id)}>
                <View style={[s.catIconBox, activeCategory === cat.id && s.catIconBoxActive]}>
                  <Text style={s.catEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={[s.catLabel, activeCategory === cat.id && s.catLabelActive]}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {/* ── Instant House Help ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>⚡ Instant House Help</Text>
            <Text style={s.sectionSub}>At your doorstep in <Text style={s.accent}>15 mins</Text></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {HOURLY.map(slot => (
                <Pressable
                  key={slot.hours}
                  style={s.hourCard}
                  onPress={() => listings[0] && navigation.navigate('ListingDetail', { listingId: listings[0].id })}
                >
                  <Text style={s.hourDur}>{slot.hours} hr</Text>
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

          {/* ── Services Grid ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>All house help services</Text>
              {activeCategory !== 'all' && (
                <Pressable onPress={() => setActiveCategory('all')}>
                  <Text style={s.clearFilter}>Clear ✕</Text>
                </Pressable>
              )}
            </View>
            <Text style={s.sectionSub}>At your doorstep in <Text style={s.accent}>15 mins ⚡</Text></Text>
            {filteredListings.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={{ fontSize: 36 }}>🔍</Text>
                <Text style={s.emptyText}>No services found</Text>
              </View>
            ) : (
              <View style={s.grid}>
                {filteredListings.map(item => {
                  const { stars } = fakeRating(item.id);
                  const origPrice = Math.round((item.price_cents * 3.2) / 100);
                  const isNew = item.id % 7 === 0;
                  return (
                    <Pressable
                      key={item.id}
                      style={[s.serviceCard, { width: CARD_W }]}
                      onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
                    >
                      {isNew && <View style={s.newBadge}><Text style={s.newBadgeText}>NEW</Text></View>}
                      <View style={s.ratingPill}><Text style={s.ratingText}>⭐ {stars}</Text></View>
                      <View style={s.emojiBox}>
                        <Text style={s.serviceEmoji}>{getEmoji(item.title)}</Text>
                      </View>
                      <Pressable style={s.addBtn} onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}>
                        <Text style={s.addBtnText}>+</Text>
                      </Pressable>
                      <Text style={s.serviceTitle} numberOfLines={2}>{item.title}</Text>
                      <View style={s.servicePriceRow}>
                        <Text style={s.servicePrice}>₹{Math.round(item.price_cents / 100)}</Text>
                        <Text style={s.serviceOrig}> ₹{origPrice}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Book for Later ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🗓 Book for Later</Text>
            <Text style={s.sectionSub}>Select your slot & stay worry-free</Text>
            <View style={s.laterRow}>
              <Pressable style={s.laterCard}>
                <Text style={s.laterEmoji}>⏰</Text>
                <Text style={s.laterTitle}>Schedule{'\n'}Booking</Text>
                <View style={s.offerBadge}><Text style={s.offerBadgeText}>UP TO 50% OFF</Text></View>
              </Pressable>
              <View style={[s.laterCard, s.laterCardDim]}>
                <Text style={s.laterEmoji}>📅</Text>
                <Text style={[s.laterTitle, { color: '#94a3b8' }]}>Recurring{'\n'}Booking</Text>
                <View style={s.unavailBadge}><Text style={s.unavailBadgeText}>UNAVAILABLE</Text></View>
              </View>
            </View>
          </View>

          {/* ── Trust ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Reliable & Trustworthy</Text>
            <View style={s.trustRow}>
              {TRUST.map(t => (
                <View key={t.title} style={s.trustCard}>
                  <View style={s.trustIconBox}><Text style={{ fontSize: 26 }}>{t.icon}</Text></View>
                  <Text style={s.trustTitle}>{t.title}</Text>
                  <Text style={s.trustSub}>{t.sub}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── FAQs ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>FAQs</Text>
            {FAQS.map((faq, i) => (
              <Pressable key={i} style={s.faqItem} onPress={() => setOpenFaq(openFaq === i ? null : i)}>
                <View style={s.faqRow}>
                  <Text style={s.faqQ}>{faq.q}</Text>
                  <Text style={s.faqToggle}>{openFaq === i ? '−' : '+'}</Text>
                </View>
                {openFaq === i && <Text style={s.faqA}>{faq.a}</Text>}
              </Pressable>
            ))}
          </View>
        </View>{/* end contentWrap */}
      </ScrollView>{/* end outer ScrollView */}

      {/* ════════ LOCATION MODAL ════════ */}
      <Modal visible={locationModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={s.modalOverlay} onPress={() => setLocationModal(false)}>
            <Pressable style={s.modalSheet} onPress={() => {}}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Change location</Text>
              <Text style={s.modalSub}>📍 {address}</Text>
              <TextInput
                style={s.modalInput}
                placeholder="Enter area, street or landmark..."
                value={customAddress}
                onChangeText={setCustomAddress}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (customAddress.trim()) { setAddress(customAddress.trim()); setCustomAddress(''); setLocationModal(false); }
                }}
              />
              <View style={s.modalRow}>
                <Pressable style={s.modalGpsBtn} onPress={() => { fetchLocation(); setLocationModal(false); }}>
                  <Text style={s.modalGpsBtnText}>📍 Use GPS</Text>
                </Pressable>
                <Pressable
                  style={[s.modalSaveBtn, !customAddress.trim() && { opacity: 0.4 }]}
                  disabled={!customAddress.trim()}
                  onPress={() => { setAddress(customAddress.trim()); setCustomAddress(''); setLocationModal(false); }}
                >
                  <Text style={s.modalSaveBtnText}>Confirm</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },

  /* ── Hero ── */
  hero: { backgroundColor: '#111827', paddingBottom: 16 },

  topRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4, gap: 10,
  },
  locationBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  locPin: { fontSize: 18 },
  locTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  locCaret: { fontSize: 13, fontWeight: '400' },
  locAddr: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconChip: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  iconChipText: { fontSize: 10, fontWeight: '800', color: '#fbbf24', marginTop: 1 },
  avatarChip: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statItem: { alignItems: 'center', gap: 1 },
  statIcon: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '500' },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },

  /* ── Content ── */
  contentWrap: { flex: 1, backgroundColor: '#f8fafc' },
  cap: { height: 20, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: '#f8fafc', marginTop: -20 },

  /* Categories */
  catScroll: { flexGrow: 0, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  catScrollInner: { paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  catItem: { alignItems: 'center', gap: 4, width: 62 },
  catIconBox: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  catIconBoxActive: { backgroundColor: '#111827', borderColor: '#111827' },
  catEmoji: { fontSize: 20 },
  catLabel: { fontSize: 10, color: '#64748b', fontWeight: '500', textAlign: 'center' },
  catLabelActive: { color: '#111827', fontWeight: '700' },

  /* Sections */
  section: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sectionSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  accent: { color: '#0f766e', fontWeight: '700' },
  clearFilter: { color: '#0f766e', fontWeight: '700', fontSize: 13 },

  /* Hourly */
  hourCard: {
    backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, marginRight: 10,
    minWidth: 130, borderWidth: 1, borderColor: '#d1fae5',
  },
  hourDur: { fontSize: 20, fontWeight: '700', color: '#111827' },
  hourPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  hourPrice: { fontSize: 17, fontWeight: '700', color: '#111827' },
  hourOrig: { fontSize: 12, color: '#94a3b8', textDecorationLine: 'line-through' },
  hourSave: { color: '#0f766e', fontWeight: '600', fontSize: 12, marginTop: 2 },
  hourBookBtn: { marginTop: 10, borderWidth: 1.5, borderColor: '#0f766e', borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  hourBookBtnText: { color: '#0f766e', fontWeight: '700', fontSize: 12 },

  /* Grid */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  serviceCard: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  newBadge: { position: 'absolute', top: 0, left: 0, backgroundColor: '#dc2626', borderTopLeftRadius: 12, borderBottomRightRadius: 8, paddingHorizontal: 5, paddingVertical: 2, zIndex: 2 },
  newBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  ratingPill: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1, zIndex: 1 },
  ratingText: { fontSize: 7.5, fontWeight: '600', color: '#111827' },
  emojiBox: { backgroundColor: '#e0f2fe', borderRadius: 10, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  serviceEmoji: { fontSize: 34 },
  addBtn: { position: 'absolute', bottom: 56, right: 6, backgroundColor: '#fff', borderRadius: 12, width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#111827', zIndex: 1 },
  addBtnText: { color: '#111827', fontWeight: '800', fontSize: 18, lineHeight: 22 },
  serviceTitle: { fontSize: 11, fontWeight: '600', color: '#111827', minHeight: 30, lineHeight: 15 },
  servicePriceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 2 },
  servicePrice: { fontSize: 13, fontWeight: '700', color: '#111827' },
  serviceOrig: { fontSize: 10, color: '#94a3b8', textDecorationLine: 'line-through' },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: '#64748b', fontSize: 15 },

  /* Book for Later */
  laterRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  laterCard: { flex: 1, backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#d1fae5', gap: 6 },
  laterCardDim: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  laterEmoji: { fontSize: 28 },
  laterTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  offerBadge: { backgroundColor: '#111827', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, alignSelf: 'flex-start' },
  offerBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  unavailBadge: { backgroundColor: '#e2e8f0', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, alignSelf: 'flex-start' },
  unavailBadgeText: { color: '#64748b', fontSize: 9, fontWeight: '700' },

  /* Trust */
  trustRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  trustCard: { flex: 1, alignItems: 'center', gap: 6 },
  trustIconBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  trustTitle: { fontSize: 12, fontWeight: '700', textAlign: 'center', color: '#111827' },
  trustSub: { fontSize: 10, color: '#64748b', textAlign: 'center' },

  /* FAQ */
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 14 },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 14, fontWeight: '500', flex: 1, paddingRight: 12, color: '#111827' },
  faqToggle: { fontSize: 22, color: '#94a3b8' },
  faqA: { marginTop: 8, color: '#64748b', lineHeight: 20, fontSize: 13 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, gap: 14 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSub: { fontSize: 13, color: '#64748b' },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 13, fontSize: 15, backgroundColor: '#f8fafc' },
  modalRow: { flexDirection: 'row', gap: 10 },
  modalGpsBtn: { flex: 1, borderWidth: 1.5, borderColor: '#111827', borderRadius: 10, padding: 13, alignItems: 'center' },
  modalGpsBtnText: { fontWeight: '700', color: '#111827' },
  modalSaveBtn: { flex: 1, backgroundColor: '#111827', borderRadius: 10, padding: 13, alignItems: 'center' },
  modalSaveBtnText: { fontWeight: '700', color: '#fff' },
});

// ── AnimatedHero styles ──
const ah = StyleSheet.create({
  container: {
    height: 220, alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginVertical: 10,
    overflow: 'hidden',
  },

  // Background glow rings
  ring: { position: 'absolute', borderRadius: 999 },
  ring1: { width: 200, height: 200, backgroundColor: '#0f766e' },
  ring2: { width: 280, height: 280, backgroundColor: '#0f766e' },

  // Sparkles
  sparkle: { position: 'absolute', fontSize: 18 },

  // Character
  characterGroup: { alignItems: 'center', justifyContent: 'center' },
  characterGlow: {
    position: 'absolute',
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(15,118,110,0.25)',
  },
  face: { fontSize: 64, zIndex: 2 },
  mopWrap: { marginTop: -8, zIndex: 2 },
  mop: { fontSize: 40 },
  badge: {
    backgroundColor: '#0f766e', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Side floating items
  floatLeft: { position: 'absolute', left: 24, top: 30 },
  floatRight: { position: 'absolute', right: 24, top: 50 },

  // Speech bubble
  bubble: {
    position: 'absolute', top: 8,
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4, maxWidth: W * 0.7,
  },
  bubbleText: { fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center' },
  bubbleTail: {
    position: 'absolute', bottom: -8, left: '50%',
    marginLeft: -8, width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },

  // Ground shadow
  shadow: {
    position: 'absolute', bottom: 0,
    width: 80, height: 10, borderRadius: 40,
    backgroundColor: '#000',
  },
});
